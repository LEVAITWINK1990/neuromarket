import { NextResponse } from "next/server";
import { assertCronAuth, autoCompleteStaleOrders } from "@/server/cron";
import { toApiResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertCronAuth(req);
    const result = await autoCompleteStaleOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return toApiResponse(err);
  }
}

export const GET = POST;
