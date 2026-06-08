import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { requestRefund } from "@/server/refunds";

const schema = z.object({ action: z.enum(["REFUND_BUYER", "RELEASE_TO_SELLER", "REJECT"]) });

// §5.3 + §5.4 — REFUND_BUYER now calls the PSP refund flow. Order /
// Payment / SellerProfile.* state changes happen in finalizeRefundSucceeded()
// once the PSP confirms via webhook; this handler only kicks off the refund
// and updates the dispute row.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiRole("ADMIN");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid");
    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: { order: { include: { commissionRecord: true } } },
    });
    if (!dispute) throw new ApiError(404, "Not found");

    const action = parsed.data.action;
    if (action === "REFUND_BUYER") {
      await requestRefund({
        orderId: dispute.orderId,
        reason: `Dispute ${dispute.id} resolved in buyer's favour`,
        initiator: "ADMIN",
        initiatedById: session.user.id,
      });
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "RESOLVED_REFUND_BUYER",
          resolution: "Admin refunded buyer in full.",
          resolvedAt: new Date(),
        },
      });
    } else if (action === "RELEASE_TO_SELLER") {
      await prisma.$transaction(async (tx) => {
        if (dispute.order.commissionRecord) {
          await tx.sellerProfile.update({
            where: { id: dispute.order.commissionRecord.sellerId },
            data: {
              pendingBalance: { decrement: dispute.order.commissionRecord.sellerEarningsCents },
              availableBalance: { increment: dispute.order.commissionRecord.sellerEarningsCents },
            },
          });
        }
        await tx.order.update({
          where: { id: dispute.orderId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: "RESOLVED_RELEASE_SELLER",
            resolution: "Admin released funds to seller.",
            resolvedAt: new Date(),
          },
        });
      });
    } else {
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "REJECTED",
          resolution: "Dispute rejected by admin.",
          resolvedAt: new Date(),
        },
      });
    }

    await logAudit({
      actorId: session.user.id,
      action: "DISPUTE_RESOLVED",
      subject: `Dispute:${dispute.id}`,
      metadata: { action: parsed.data.action },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
