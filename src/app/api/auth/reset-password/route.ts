import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { consumePasswordResetToken } from "@/server/tokens";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    // §6.4 — same bucket as the request endpoint to discourage brute-forcing
    // valid tokens after a leaked reset email.
    await requireRateLimit(rl.passwordReset, rateLimitKey(req));
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid request");
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const row = await consumePasswordResetToken(parsed.data.token, passwordHash);
    if (!row) throw new ApiError(400, "Token invalid or expired", "INVALID_TOKEN");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
