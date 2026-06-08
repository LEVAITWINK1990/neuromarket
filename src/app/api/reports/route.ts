import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validation";
import { requireApiVerifiedEmailSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // §6.7 — abuse reports can pull products off the marketplace; require
    // verified email so reports map to real users.
    const session = await requireApiVerifiedEmailSession();
    // §6.4 — 10 reports per day per (IP+userId).
    await requireRateLimit(rl.reports, rateLimitKey(req, session.user.id));
    const parsed = reportSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request");
    await prisma.productReport.create({
      data: {
        productId: parsed.data.productId,
        reporterId: session.user.id,
        reason: parsed.data.reason,
        description: parsed.data.description,
      },
    });
    const count = await prisma.productReport.count({
      where: { productId: parsed.data.productId },
    });
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (product) {
      const bump = Math.min(40, count * 10);
      await prisma.product.update({
        where: { id: product.id },
        data: { riskScore: Math.min(100, product.riskScore + 5 + bump / 4) },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
