import { NextResponse } from "next/server";
import { assertCronAuth, purgeExpiredTokens } from "@/server/cron";
import { toApiResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertCronAuth(req);
    const result = await purgeExpiredTokens();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return toApiResponse(err);
  }
}

export const GET = POST;
