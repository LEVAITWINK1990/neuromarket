import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiSellerSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { encryptString } from "@/lib/crypto";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

const schema = z
  .object({
    method: z.enum(["bank_transfer", "card", "yoomoney"]).default("bank_transfer"),
    details: z
      .object({
        account: z.string().min(4).max(64),
        recipientName: z.string().min(2).max(120),
        bankName: z.string().max(120).optional(),
        bic: z.string().max(32).optional(),
        inn: z.string().max(32).optional(),
      })
      .optional(),
  })
  .optional();

export async function POST(req: Request) {
  try {
    // §6.7 — requesting a payout moves money; require verified email.
    const session = await requireApiSellerSession({ requireVerifiedEmail: true });
    // §6.4 — 5 payout requests per (IP+sellerId) per day.
    await requireRateLimit(rl.payouts, rateLimitKey(req, session.user.id));

    let parsed: z.infer<typeof schema> = undefined;
    const text = await req.text().catch(() => "");
    if (text) {
      const parsedResult = schema.safeParse(JSON.parse(text));
      if (!parsedResult.success) {
        throw new ApiError(400, parsedResult.error.issues[0]?.message ?? "Invalid request");
      }
      parsed = parsedResult.data;
    }

    const profile = await prisma.sellerProfile.findUnique({
      where: { id: session.user.sellerProfileId! },
    });
    if (!profile) throw new ApiError(404, "Not found");
    if (profile.availableBalance <= 0) throw new ApiError(400, "No available balance");

    const amount = profile.availableBalance;
    const detailsEncrypted = parsed?.details ? encryptString(JSON.stringify(parsed.details)) : null;

    await prisma.$transaction([
      prisma.payout.create({
        data: {
          sellerId: profile.id,
          amountCents: amount,
          status: "REQUESTED",
          method: parsed?.method ?? "bank_transfer",
          detailsEncrypted,
        },
      }),
      prisma.sellerProfile.update({
        where: { id: profile.id },
        data: {
          availableBalance: { decrement: amount },
          withdrawnBalance: { increment: amount },
        },
      }),
    ]);
    await logAudit({
      actorId: session.user.id,
      action: "PAYOUT_REQUESTED",
      subject: `Seller:${profile.id}`,
      metadata: { amountCents: amount, method: parsed?.method ?? "bank_transfer" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
