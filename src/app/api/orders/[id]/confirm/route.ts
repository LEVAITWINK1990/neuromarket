import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/guards";
import { toApiResponse } from "@/lib/api-error";
import { confirmOrderDelivery } from "@/server/checkout";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiSession();
    const result = await confirmOrderDelivery(params.id, session.user.id);
    return NextResponse.json({ ok: true, status: result?.status ?? null });
  } catch (err) {
    return toApiResponse(err);
  }
}
