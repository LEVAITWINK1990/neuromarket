import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { requireApiSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { createEmailVerificationToken } from "@/server/tokens";
import { sendEmail, emailTemplates } from "@/lib/email";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    // §6.4 — 5 resend requests per (IP+userId) per hour.
    await requireRateLimit(rl.emailVerification, rateLimitKey(req, session.user.id));
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user?.email) throw new ApiError(400, "No email on file");
    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    const token = await createEmailVerificationToken(user.id, user.email);
    const verifyUrl = `${env.APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const tmpl = emailTemplates.verifyEmail({ verifyUrl });
    await sendEmail({ ...tmpl, to: user.email });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
