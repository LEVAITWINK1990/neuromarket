import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { consumeEmailVerificationToken } from "@/server/tokens";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid token");
    const row = await consumeEmailVerificationToken(parsed.data.token);
    if (!row) throw new ApiError(400, "Token invalid or expired", "INVALID_TOKEN");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
