import { randomUUID } from "node:crypto";
import type { Prisma, RefundInitiator } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { logAudit } from "@/lib/audit";
import { scoped } from "@/lib/logger";

const refundsLog = scoped("refunds");

/**
 * §5.4 — pure helper. Given the current order/payment state and refund
 * amount, decide how much to subtract from each seller balance bucket.
 *
 * Exposed for unit tests; the runtime call inside finalizeRefundSucceeded
 * uses the same shape via Prisma's mutation API.
 *
 * `fromWithdrawn > 0` means the seller ran out of available funds during
 * the refund and now owes the platform — caller should surface a warn.
 */
export function computeRefundBalanceDeltas(input: {
  orderStatus: "PAID" | "DELIVERED" | "COMPLETED" | "REFUNDED" | "PENDING_PAYMENT" | string;
  totalEarningsCents: number;
  paymentAmountCents: number;
  refundAmountCents: number;
  availableBalance: number;
}): { fromPending: number; fromAvailable: number; fromWithdrawn: number } {
  const share =
    input.paymentAmountCents > 0
      ? Math.min(1, input.refundAmountCents / input.paymentAmountCents)
      : 0;
  const earningsDelta = Math.round(input.totalEarningsCents * share);
  if (earningsDelta <= 0) {
    return { fromPending: 0, fromAvailable: 0, fromWithdrawn: 0 };
  }

  if (input.orderStatus === "COMPLETED" || input.orderStatus === "REFUNDED") {
    const fromAvailable = Math.min(Math.max(input.availableBalance, 0), earningsDelta);
    const fromWithdrawn = earningsDelta - fromAvailable;
    return { fromPending: 0, fromAvailable, fromWithdrawn };
  }
  return { fromPending: earningsDelta, fromAvailable: 0, fromWithdrawn: 0 };
}

export interface RequestRefundInput {
  orderId: string;
  amountCents?: number; // defaults to full remaining refundable amount
  reason: string;
  initiator: RefundInitiator;
  initiatedById?: string;
}

/**
 * §5.3 — request a refund from the PSP. Creates a Refund row in PENDING
 * status with a stable idempotency key, calls the provider, and persists the
 * provider refund id. Balance/Order/Payment state transitions happen in
 * {@link finalizeRefundSucceeded}, which is invoked from the webhook
 * processor once the PSP confirms.
 *
 * For YooKassa the refund call is synchronous and usually responds with the
 * final state, but we still wait for `refund.succeeded` to flip the order to
 * REFUNDED — the source of truth is the webhook, not the API response.
 */
export async function requestRefund(input: RequestRefundInput) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { payment: { include: { refunds: true } } },
  });
  if (!order) throw new Error("Order not found");
  const payment = order.payment;
  if (!payment || payment.status === "PENDING" || payment.status === "FAILED") {
    throw new Error("Order has not been paid yet");
  }
  if (!payment.providerPaymentId) {
    throw new Error("Payment has no provider payment id");
  }

  const remaining = payment.amountCents - payment.refundedAmountCents;
  if (remaining <= 0) {
    throw new Error("Payment has already been fully refunded");
  }
  const amount = input.amountCents ?? remaining;
  if (amount <= 0) throw new Error("Refund amount must be positive");
  if (amount > remaining) {
    throw new Error(`Refund amount ${amount} exceeds remaining refundable ${remaining}`);
  }

  const idempotencyKey = randomUUID();
  const refund = await prisma.refund.create({
    data: {
      paymentId: payment.id,
      providerId: payment.providerId,
      idempotencyKey,
      amountCents: amount,
      currency: payment.currency,
      initiator: input.initiator,
      initiatedById: input.initiatedById,
      reason: input.reason.slice(0, 250),
      status: "PENDING",
    },
  });

  const provider = getPaymentProvider(payment.providerId as "yookassa" | "crypto");
  try {
    const result = await provider.refund(
      payment.providerPaymentId,
      amount,
      input.reason,
      idempotencyKey,
    );
    await prisma.refund.update({
      where: { id: refund.id },
      data: {
        providerRefundId: result.providerRefundId,
        status: result.status === "succeeded" ? "SUCCEEDED" : "PENDING",
      },
    });
    if (result.status === "succeeded") {
      await finalizeRefundSucceeded({
        providerRefundId: result.providerRefundId,
        amountCents: amount,
      });
    }
    await logAudit({
      actorId: input.initiatedById ?? null,
      action: "REFUND_REQUESTED",
      subject: `Order:${order.id}`,
      metadata: {
        amountCents: amount,
        initiator: input.initiator,
        providerRefundId: result.providerRefundId,
      },
    });
    return {
      refundId: refund.id,
      providerRefundId: result.providerRefundId,
      status: result.status,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Refund failed";
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "FAILED", failureReason: msg },
    });
    refundsLog.error(
      { err, orderId: order.id, refundId: refund.id, amountCents: amount },
      "PSP refund call failed",
    );
    throw err;
  }
}

interface FinalizeRefundInput {
  providerRefundId: string;
  amountCents: number;
}

/**
 * §5.3 + §5.4 — invoked from the webhook handler on refund.succeeded. Idempotent.
 * Decrements seller balance from the correct bucket (pending / available)
 * depending on order state, marks order REFUNDED (full) or keeps PAID/
 * DELIVERED (partial), flips Payment to REFUNDED / PARTIALLY_REFUNDED.
 */
export async function finalizeRefundSucceeded(input: FinalizeRefundInput) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { providerRefundId: input.providerRefundId },
      include: {
        payment: {
          include: { order: { include: { commissionRecord: true } } },
        },
      },
    });
    if (!refund) throw new Error(`Refund not found for ${input.providerRefundId}`);
    if (refund.status === "SUCCEEDED") return refund; // idempotent

    const payment = refund.payment;
    const order = payment.order;

    await tx.refund.update({
      where: { id: refund.id },
      data: { status: "SUCCEEDED", succeededAt: new Date() },
    });

    const newRefundedTotal = payment.refundedAmountCents + refund.amountCents;
    const isFullyRefunded = newRefundedTotal >= payment.amountCents;

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        refundedAmountCents: newRefundedTotal,
        status: isFullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });

    // §5.4 — balance state machine. Earnings flow:
    //   PENDING_PAYMENT → (paid) → pendingBalance
    //   COMPLETED       → availableBalance
    //   payout          → withdrawnBalance
    // Logic lives in `computeRefundBalanceDeltas` (pure, unit-tested).
    if (order.commissionRecord) {
      const sellerId = order.commissionRecord.sellerId;
      const seller = await tx.sellerProfile.findUnique({
        where: { id: sellerId },
        select: { availableBalance: true },
      });
      const deltas = computeRefundBalanceDeltas({
        orderStatus: order.status,
        totalEarningsCents: order.commissionRecord.sellerEarningsCents,
        paymentAmountCents: payment.amountCents,
        refundAmountCents: refund.amountCents,
        availableBalance: seller?.availableBalance ?? 0,
      });
      if (deltas.fromPending > 0 || deltas.fromAvailable > 0 || deltas.fromWithdrawn > 0) {
        await tx.sellerProfile.update({
          where: { id: sellerId },
          data: {
            ...(deltas.fromPending > 0
              ? { pendingBalance: { decrement: deltas.fromPending } }
              : {}),
            ...(deltas.fromAvailable > 0
              ? { availableBalance: { decrement: deltas.fromAvailable } }
              : {}),
            ...(deltas.fromWithdrawn > 0
              ? { withdrawnBalance: { decrement: deltas.fromWithdrawn } }
              : {}),
          },
        });
        if (deltas.fromWithdrawn > 0) {
          refundsLog.warn(
            {
              sellerId,
              orderId: order.id,
              refundId: refund.id,
              ...deltas,
            },
            "refund pulled into withdrawn — seller balance is in debt",
          );
        }
      }
    }

    if (isFullyRefunded) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
    }

    refundsLog.info(
      {
        refundId: refund.id,
        orderId: order.id,
        amountCents: refund.amountCents,
        fully: isFullyRefunded,
      },
      "refund finalized",
    );
    return refund;
  });
}
