import { NextResponse } from "next/server";
import { assertCronAuth, listStuckPayments } from "@/server/cron";
import { toApiResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertCronAuth(req);
    const stuck = await listStuckPayments();
    return NextResponse.json({ ok: true, stuckCount: stuck.length, sample: stuck.slice(0, 25) });
  } catch (err) {
    return toApiResponse(err);
  }
}

export const GET = POST;
