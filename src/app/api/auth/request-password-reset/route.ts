import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { createPasswordResetToken } from "@/server/tokens";
import { sendEmail, emailTemplates } from "@/lib/email";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

// Always returns ok to avoid leaking which emails are registered.
export async function POST(req: Request) {
  try {
    // §6.4 — 5 reset requests per IP per hour.
    await requireRateLimit(rl.passwordReset, rateLimitKey(req));
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid email");
    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${env.APP_URL.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(token)}`;
      const tmpl = emailTemplates.resetPassword({ resetUrl });
      await sendEmail({ ...tmpl, to: email });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
