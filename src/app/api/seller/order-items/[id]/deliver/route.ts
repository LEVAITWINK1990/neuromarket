import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSellerSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiSellerSession();
    const item = await prisma.orderItem.findFirst({
      where: { id: params.id, sellerId: session.user.sellerProfileId! },
      include: { order: true },
    });
    if (!item) throw new ApiError(404, "Not found");

    // §5.10 — seller can only deliver after PSP has confirmed payment.
    if (item.order.status !== "PAID") {
      throw new ApiError(400, `Order is not paid (status=${item.order.status})`, "ORDER_NOT_PAID");
    }

    await prisma.$transaction([
      prisma.orderItem.update({
        where: { id: item.id },
        data: { deliveredAt: new Date(), manualDeliveryNote: "Seller marked as delivered" },
      }),
      prisma.order.update({
        where: { id: item.orderId },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
