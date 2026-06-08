import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

const schema = z.object({ banned: z.boolean() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiRole("ADMIN");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid");
    await prisma.user.update({
      where: { id: params.id },
      data: { isBanned: parsed.data.banned },
    });
    await logAudit({
      actorId: session.user.id,
      action: parsed.data.banned ? "USER_BANNED" : "USER_UNBANNED",
      subject: `User:${params.id}`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
