import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { containsSensitive } from "@/lib/validation";
import { requireApiVerifiedEmailSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.string().optional(),
  threadId: z.string().optional(),
  recipientId: z.string().optional(),
  body: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  try {
    // §6.7 — message spam reaches counterparties; require verified email.
    const session = await requireApiVerifiedEmailSession();
    // §6.4 — 30 messages per minute per (IP+userId).
    await requireRateLimit(rl.messages, rateLimitKey(req, session.user.id));
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request");

    let threadId = parsed.data.threadId;
    const flagged = containsSensitive(parsed.data.body);

    if (threadId) {
      // §5.2 Messages auth gap — verify the caller is a participant in the
      // referenced thread before letting them post.
      const thread = await prisma.messageThread.findUnique({
        where: { id: threadId },
        select: { buyerId: true, sellerId: true },
      });
      if (!thread) throw new ApiError(404, "Thread not found");
      const isParticipant =
        thread.buyerId === session.user.id || thread.sellerId === session.user.id;
      if (!isParticipant) throw new ApiError(403, "Forbidden");
    } else {
      if (!parsed.data.productId || !parsed.data.recipientId) {
        throw new ApiError(400, "Need productId or recipientId");
      }
      const product = await prisma.product.findUnique({
        where: { id: parsed.data.productId },
        include: { seller: true },
      });
      if (!product) throw new ApiError(404, "Product not found");
      const buyerId =
        session.user.id === product.seller.userId ? parsed.data.recipientId : session.user.id;
      const sellerId =
        session.user.id === product.seller.userId ? session.user.id : product.seller.userId;
      // Sanity — caller must be one of the two ends.
      if (buyerId !== session.user.id && sellerId !== session.user.id) {
        throw new ApiError(403, "Forbidden");
      }
      const thread = await prisma.messageThread.create({
        data: {
          buyerId,
          sellerId,
          productId: product.id,
          subject: product.title,
        },
      });
      threadId = thread.id;
    }

    await prisma.message.create({
      data: {
        threadId,
        senderId: session.user.id,
        body: parsed.data.body,
        flagged,
      },
    });
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true, threadId, flagged });
  } catch (err) {
    return toApiResponse(err);
  }
}
