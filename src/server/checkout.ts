import type { Prisma, DigitalInventoryItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateOrderTotals, DEFAULT_FEE_CONFIG } from "@/lib/commission";
import { logAudit } from "@/lib/audit";
import { pickNextAvailableCode } from "@/lib/inventory";
import { decryptString, encryptString, isEncrypted } from "@/lib/crypto";
import { scoped } from "@/lib/logger";

const paymentsLog = scoped("payments");

/**
 * Create an order for a single product. For services / manual delivery this
 * does NOT assign inventory; for instant license/voucher delivery it reserves
 * one inventory item.
 */
export async function createOrderForProduct(buyerId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true, inventoryItems: true },
  });
  if (!product || product.status !== "PUBLISHED") {
    throw new Error("Product not available");
  }
  if (product.seller.userId === buyerId) {
    throw new Error("You cannot buy your own product");
  }

  const needsInventory =
    product.productType === "LICENSE_KEY" || product.productType === "VOUCHER_CODE";
  if (needsInventory) {
    const next = pickNextAvailableCode(product.inventoryItems);
    if (!next) throw new Error("Out of stock");
  }

  const totals = calculateOrderTotals(
    [{ priceCents: product.priceCents, quantity: 1 }],
    DEFAULT_FEE_CONFIG,
  );

  const order = await prisma.order.create({
    data: {
      buyerId,
      status: "PENDING_PAYMENT",
      subtotalCents: totals.subtotalCents,
      platformFeeCents: totals.platformFeeCents,
      processingFeeCents: totals.processingFeeCents,
      totalCents: totals.totalCents,
      currency: product.currency,
      items: {
        create: [
          {
            productId: product.id,
            sellerId: product.sellerId,
            title: product.title,
            priceCents: product.priceCents,
            deliveryType: product.deliveryType,
            productType: product.productType,
            externalUrl: product.externalUrl,
          },
        ],
      },
      payment: { create: { amountCents: totals.totalCents } },
    },
    include: { items: true },
  });
  return order;
}

/**
 * Atomic inventory claim. §5.6 — replaces the racy find→update pattern.
 *
 * Uses a single conditional `updateMany` keyed on `(id, status=AVAILABLE)` so
 * that if two concurrent confirmations target the same row only one wins.
 * Returns the claimed item or `null` if no AVAILABLE rows remained.
 *
 * The Postgres-native alternative is
 * `UPDATE ... WHERE id IN (SELECT id FROM digital_inventory_item WHERE
 *  product_id = $1 AND status = 'AVAILABLE' ORDER BY created_at LIMIT 1
 *  FOR UPDATE SKIP LOCKED) RETURNING *` — slightly less round-trippy but
 * tied to PG. We keep the portable approach because Prisma's `updateMany`
 * with a unique-id WHERE is itself atomic on the DB level.
 */
export async function claimInventoryCode(
  tx: Prisma.TransactionClient,
  productId: string,
  orderItemId: string,
  maxAttempts = 5,
): Promise<DigitalInventoryItem | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = await tx.digitalInventoryItem.findFirst({
      where: { productId, status: "AVAILABLE" },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;
    const result = await tx.digitalInventoryItem.updateMany({
      where: { id: candidate.id, status: "AVAILABLE" },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        orderItemId,
      },
    });
    if (result.count === 1) {
      // §6.2 — decrypt the at-rest code before returning to caller. Legacy
      // (pre-encryption) plaintext codes pass through unchanged.
      const plain = isEncrypted(candidate.code) ? decryptString(candidate.code) : candidate.code;
      return {
        ...candidate,
        code: plain,
        status: "DELIVERED",
        deliveredAt: new Date(),
        orderItemId,
      };
    }
    // Lost the race; the row was claimed by a concurrent transaction. Loop and
    // pick another candidate.
  }
  return null;
}

export interface ConfirmOrderPaymentInput {
  providerId: string;
  providerPaymentId: string;
  paidAmountCents: number;
  paidCurrency: string;
}

/**
 * Confirm payment for an order. Idempotent — running twice on a PAID/DELIVERED/
 * COMPLETED order is a no-op.
 *
 * Wraps the body in a SERIALIZABLE transaction with a small retry loop to
 * tolerate 40001 (`serialization_failure`) under concurrent inventory pressure.
 */
export async function confirmOrderPayment(orderId: string, input: ConfirmOrderPaymentInput) {
  const MAX_TX_RETRIES = 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_TX_RETRIES; attempt += 1) {
    try {
      const order = await prisma.$transaction(
        async (tx) => confirmOrderPaymentInTx(tx, orderId, input),
        { isolationLevel: "Serializable" },
      );
      // §9.2 — emit a structured event so observability tools can graph PSP
      // confirmations and alert on stalls / mismatches.
      paymentsLog.info(
        {
          orderId,
          providerId: input.providerId,
          providerPaymentId: input.providerPaymentId,
          amountCents: input.paidAmountCents,
          attempt,
        },
        "order payment confirmed",
      );
      return order;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // PG SQLSTATE 40001 (serialization_failure) or 40P01 (deadlock_detected)
      if (!/40001|40P01|could not serialize|deadlock detected/i.test(msg)) {
        paymentsLog.error(
          { err, orderId, providerPaymentId: input.providerPaymentId },
          "confirmOrderPayment failed",
        );
        throw err;
      }
      const backoff = 50 * 2 ** attempt;
      paymentsLog.warn(
        { orderId, attempt, backoff },
        "confirmOrderPayment retrying after serialization conflict",
      );
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr ?? new Error("confirmOrderPayment retries exhausted");
}

async function confirmOrderPaymentInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  input: ConfirmOrderPaymentInput,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      payment: true,
    },
  });
  if (!order) throw new Error("Order not found");

  if (order.status === "PAID" || order.status === "DELIVERED" || order.status === "COMPLETED") {
    return order;
  }

  const payment = order.payment;
  if (!payment) throw new Error("Order has no payment row");
  if (payment.providerId !== input.providerId) {
    throw new Error(`Provider mismatch: stored=${payment.providerId} webhook=${input.providerId}`);
  }
  if (payment.providerPaymentId && payment.providerPaymentId !== input.providerPaymentId) {
    throw new Error(`Provider payment id mismatch for order ${order.id}`);
  }
  if (payment.amountCents !== input.paidAmountCents) {
    throw new Error(
      `Amount mismatch on order ${order.id}: expected ${payment.amountCents} cents, paid ${input.paidAmountCents}`,
    );
  }
  if (payment.currency.toUpperCase() !== input.paidCurrency.toUpperCase()) {
    throw new Error(
      `Currency mismatch on order ${order.id}: expected ${payment.currency}, paid ${input.paidCurrency}`,
    );
  }
  if (payment.buyerId && payment.buyerId !== order.buyerId) {
    throw new Error(`Buyer mismatch on order ${order.id}`);
  }

  await tx.payment.update({
    where: { orderId },
    data: {
      status: "SUCCEEDED",
      providerPaymentId: input.providerPaymentId,
      paidAt: new Date(),
    },
  });

  const updates: { itemId: string; code?: string }[] = [];
  let allDelivered = true;
  for (const item of order.items) {
    if (item.productType === "LICENSE_KEY" || item.productType === "VOUCHER_CODE") {
      const claimed = await claimInventoryCode(tx, item.productId, item.id);
      if (!claimed) {
        allDelivered = false;
        continue;
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: 1 }, salesCount: { increment: 1 } },
      });
      await tx.orderItem.update({
        where: { id: item.id },
        data: { deliveredCode: claimed.code, deliveredAt: new Date() },
      });
      updates.push({ itemId: item.id, code: claimed.code });
    } else if (item.productType === "DIGITAL_FILE") {
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          deliveredFileUrl: item.product.digitalFileUrl,
          deliveredAt: new Date(),
        },
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { salesCount: { increment: 1 } },
      });
      updates.push({ itemId: item.id });
    } else if (item.productType === "AFFILIATE_OFFER") {
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          externalUrl: item.product.externalUrl,
          deliveredAt: new Date(),
        },
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { salesCount: { increment: 1 } },
      });
      updates.push({ itemId: item.id });
    } else {
      // SERVICE or MANUAL_DELIVERY — seller fulfils manually
      allDelivered = false;
    }
  }

  const autoCompleteAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const platformFee = order.platformFeeCents;
  const processingFee = order.processingFeeCents;
  const sellerEarnings = Math.max(0, order.subtotalCents - platformFee - processingFee);

  // Commission record + seller balance (escrow into pending). Single-seller
  // orders only for now (TZ §7.4 covers multi-seller in a later phase).
  const sellerId = order.items[0].sellerId;
  await tx.commissionRecord.upsert({
    where: { orderId: order.id },
    update: {},
    create: {
      orderId: order.id,
      sellerId,
      feePercent: platformFee > 0 ? (platformFee / order.subtotalCents) * 100 : 0,
      feeCents: platformFee,
      processingFeeCents: processingFee,
      sellerEarningsCents: sellerEarnings,
    },
  });
  await tx.sellerProfile.update({
    where: { id: sellerId },
    data: { pendingBalance: { increment: sellerEarnings } },
  });

  const newStatus = allDelivered ? "DELIVERED" : "PAID";
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      paidAt: new Date(),
      deliveredAt: allDelivered ? new Date() : null,
      autoCompleteAt,
    },
  });

  await logAudit({
    actorId: order.buyerId,
    action: "DIGITAL_CODE_DELIVERED",
    subject: `Order:${order.id}`,
    metadata: { itemUpdates: updates.length },
  });

  return tx.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
}

/**
 * Buyer confirms delivery — moves seller earnings from pending → available.
 */
export async function confirmOrderDelivery(orderId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, commissionRecord: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.buyerId !== actorId) throw new Error("Not your order");
    if (order.status === "COMPLETED" || order.status === "REFUNDED") return order;

    if (order.commissionRecord) {
      await tx.sellerProfile.update({
        where: { id: order.commissionRecord.sellerId },
        data: {
          pendingBalance: { decrement: order.commissionRecord.sellerEarningsCents },
          availableBalance: { increment: order.commissionRecord.sellerEarningsCents },
        },
      });
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });
}
