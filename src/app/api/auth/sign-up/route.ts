import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { signUpSchema } from "@/lib/validation";
import { env } from "@/lib/env";
import { createEmailVerificationToken } from "@/server/tokens";
import { sendEmail, emailTemplates } from "@/lib/email";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";
import { toApiResponse } from "@/lib/api-error";
import { scoped } from "@/lib/logger";

const log = scoped("sign-up");

export async function POST(req: Request) {
  try {
    // §6.4 — 5 sign-ups per IP per hour.
    await requireRateLimit(rl.signUp, rateLimitKey(req));
  } catch (err) {
    return toApiResponse(err);
  }
  let payload: z.infer<typeof signUpSchema>;
  try {
    payload = signUpSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request" },
      { status: 400 },
    );
  }
  const email = payload.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 400 },
    );
  }
  const passwordHash = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      email,
      name: payload.name,
      passwordHash,
      role: payload.role,
    },
  });
  if (payload.role === "SELLER") {
    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        displayName: payload.name,
        contactEmail: email,
      },
    });
  }

  // §6.7 — fire a verification email but don't block sign-up on delivery
  // (e.g. dev console provider). Errors here are logged but swallowed.
  try {
    const token = await createEmailVerificationToken(user.id, email);
    const verifyUrl = `${env.APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const tmpl = emailTemplates.verifyEmail({ verifyUrl });
    await sendEmail({ ...tmpl, to: email });
  } catch (err) {
    log.warn({ err, userId: user.id }, "failed to send verification email");
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
