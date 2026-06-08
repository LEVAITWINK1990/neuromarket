import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { scoped } from "@/lib/logger";

const log = scoped("admin-messages");

// §7.3 — admin flagged messages moderation. Actions:
//   UNFLAG  — false-positive: keep the message, clear the flag, so the
//             thread continues normally
//   REMOVE  — message violates policy (sharing contacts off-platform, scam
//             attempt, etc.): hard-delete the row, leaving the rest of the
//             thread intact. The audit log records who removed it and why.
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("UNFLAG") }),
  z.object({
    action: z.literal("REMOVE"),
    reason: z.string().min(1).max(500),
  }),
]);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiRole("ADMIN");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const message = await prisma.message.findUnique({
      where: { id: params.id },
      select: { id: true, body: true, senderId: true, threadId: true, flagged: true },
    });
    if (!message) throw new ApiError(404, "Message not found");

    if (parsed.data.action === "UNFLAG") {
      if (!message.flagged) {
        // Idempotent: already cleared.
        return NextResponse.json({ ok: true, unchanged: true });
      }
      await prisma.message.update({
        where: { id: message.id },
        data: { flagged: false },
      });
      await logAudit({
        actorId: session.user.id,
        action: "REPORT_RESOLVED",
        subject: `Message:${message.id}`,
        metadata: { action: "UNFLAG", threadId: message.threadId },
      });
    } else {
      // Capture a snippet in the audit log BEFORE delete so we can prove
      // what the message contained if the user disputes later.
      const snippet = message.body.slice(0, 200);
      await prisma.message.delete({ where: { id: message.id } });
      await logAudit({
        actorId: session.user.id,
        action: "REVIEW_HIDDEN",
        subject: `Message:${message.id}`,
        metadata: {
          action: "REMOVE",
          reason: parsed.data.reason,
          threadId: message.threadId,
          senderId: message.senderId,
          snippet,
        },
      });
    }

    log.info(
      { messageId: message.id, action: parsed.data.action, by: session.user.id },
      "admin moderation action on flagged message",
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
