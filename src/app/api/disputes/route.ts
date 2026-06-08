import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disputeSchema } from "@/lib/validation";
import { requireApiVerifiedEmailSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

export async function POST(req: Request) {
  try {
    // §6.7 — opening a dispute can refund money; require verified email.
    const session = await requireApiVerifiedEmailSession();
    const parsed = disputeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid request");
    }
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: { items: true },
    });
    if (!order || order.buyerId !== session.user.id) {
      throw new ApiError(404, "Order not found");
    }
    if (order.status === "REFUNDED" || order.status === "CANCELLED") {
      throw new ApiError(400, "Order is closed");
    }
    const sellerId = order.items[0]?.sellerId;
    if (!sellerId) throw new ApiError(400, "Invalid order");
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: { user: true },
    });
    if (!sellerProfile) throw new ApiError(400, "Invalid seller");

    const dispute = await prisma.dispute.upsert({
      where: { orderId: order.id },
      update: {},
      create: {
        orderId: order.id,
        buyerId: session.user.id,
        sellerId: sellerProfile.userId,
        reason: parsed.data.reason,
        description: parsed.data.description,
        messages: {
          create: [{ senderId: session.user.id, body: parsed.data.description }],
        },
      },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "DISPUTED" },
    });
    return NextResponse.json({ ok: true, disputeId: dispute.id });
  } catch (err) {
    return toApiResponse(err);
  }
}
