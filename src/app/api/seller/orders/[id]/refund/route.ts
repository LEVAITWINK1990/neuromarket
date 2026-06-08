import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSellerSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { requestRefund } from "@/server/refunds";

const schema = z.object({
  reason: z.string().min(3).max(250),
  amountCents: z.number().int().positive().optional(),
});

// §5.3 — seller-initiated refund. Lets the seller proactively refund a buyer
// before the buyer opens a dispute. Only the order's seller may invoke this.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiSellerSession();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid");

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        items: { some: { sellerId: session.user.sellerProfileId! } },
      },
      include: { items: true },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.status === "PENDING_PAYMENT" || order.status === "CANCELLED") {
      throw new ApiError(400, "Order has not been paid", "NOT_REFUNDABLE");
    }
    if (order.status === "REFUNDED") {
      throw new ApiError(400, "Order is already refunded", "ALREADY_REFUNDED");
    }

    const result = await requestRefund({
      orderId: order.id,
      amountCents: parsed.data.amountCents,
      reason: parsed.data.reason,
      initiator: "SELLER",
      initiatedById: session.user.id,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return toApiResponse(err);
  }
}
