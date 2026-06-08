import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

const schema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request");

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId: session.user.id, productId: parsed.data.productId },
      },
    });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }
    await prisma.wishlistItem.create({
      data: { userId: session.user.id, productId: parsed.data.productId },
    });
    return NextResponse.json({ saved: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
