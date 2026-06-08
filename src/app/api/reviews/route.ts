import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation";
import { requireApiVerifiedEmailSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // §6.7 — reviews shape public reputation; require verified email to
    // prevent throwaway-account spam.
    const session = await requireApiVerifiedEmailSession();
    // §6.4 — 20 reviews per (IP+userId) per day.
    await requireRateLimit(rl.reviews, rateLimitKey(req, session.user.id));
    const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
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
    if (order.status !== "COMPLETED" && order.status !== "DELIVERED") {
      throw new ApiError(400, "You can only review completed orders");
    }
    const item = order.items.find((i) => i.productId === parsed.data.productId);
    if (!item) throw new ApiError(400, "Product not in this order");

    const existing = await prisma.review.findUnique({
      where: { orderId_productId: { orderId: order.id, productId: item.productId } },
    });
    if (existing) throw new ApiError(400, "Already reviewed");

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        sellerId: item.sellerId,
        buyerId: session.user.id,
        rating: parsed.data.rating,
        text: parsed.data.text,
      },
    });

    const stats = await prisma.review.aggregate({
      where: { productId: item.productId, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        rating: stats._avg.rating ?? 0,
        ratingCount: stats._count._all,
      },
    });
    const sellerStats = await prisma.review.aggregate({
      where: { sellerId: item.sellerId, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.sellerProfile.update({
      where: { id: item.sellerId },
      data: {
        rating: sellerStats._avg.rating ?? 0,
        ratingCount: sellerStats._count._all,
      },
    });

    return NextResponse.json({ ok: true, reviewId: review.id });
  } catch (err) {
    return toApiResponse(err);
  }
}
