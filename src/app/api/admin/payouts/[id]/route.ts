import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { scoped } from "@/lib/logger";

const payoutsLog = scoped("admin-payouts");

// §7.2 — admin payouts UI. Actions:
//   APPROVE   PENDING/REQUESTED → PROCESSING (admin acknowledged the request,
//                                  bank transfer is on its way)
//   MARK_PAID PROCESSING → PAID  (admin confirms the transfer landed and
//                                  decrements availableBalance / increments
//                                  withdrawnBalance)
//   REJECT    PENDING/REQUESTED/PROCESSING → FAILED (admin rejected;
//                                  failureReason recorded; seller balance
//                                  untouched)
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("APPROVE") }),
  z.object({
    action: z.literal("MARK_PAID"),
    externalTxnId: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal("REJECT"),
    failureReason: z.string().min(1).max(500),
  }),
]);

const ALLOWED_FROM: Record<"APPROVE" | "MARK_PAID" | "REJECT", string[]> = {
  APPROVE: ["PENDING", "REQUESTED"],
  MARK_PAID: ["PROCESSING"],
  REJECT: ["PENDING", "REQUESTED", "PROCESSING"],
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiRole("ADMIN");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true, amountCents: true, status: true },
    });
    if (!payout) throw new ApiError(404, "Payout not found");
    if (!ALLOWED_FROM[parsed.data.action].includes(payout.status)) {
      throw new ApiError(409, `Cannot ${parsed.data.action} from ${payout.status}`);
    }

    const now = new Date();
    if (parsed.data.action === "APPROVE") {
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "PROCESSING",
          processedById: session.user.id,
          processedAt: now,
        },
      });
    } else if (parsed.data.action === "MARK_PAID") {
      // Local re-bind so the discriminated union narrowing survives across
      // the $transaction async boundary.
      const markPaid = parsed.data;
      // Money actually leaves the platform here. Decrement availableBalance
      // and increment withdrawnBalance in the same transaction as the Payout
      // flip so partial failures can't desync the ledger.
      await prisma.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: payout.id },
          data: {
            status: "PAID",
            paidAt: now,
            processedById: session.user.id,
            processedAt: now,
            externalTxnId: markPaid.externalTxnId,
          },
        });
        await tx.sellerProfile.update({
          where: { id: payout.sellerId },
          data: {
            availableBalance: { decrement: payout.amountCents },
            withdrawnBalance: { increment: payout.amountCents },
          },
        });
      });
    } else {
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "FAILED",
          processedById: session.user.id,
          processedAt: now,
          failureReason: parsed.data.failureReason,
        },
      });
    }

    // We reuse the existing PAYOUT_PROCESSED enum value across APPROVE /
    // MARK_PAID / REJECT — the discriminator goes in metadata so the audit
    // log stays filterable without growing the enum.
    await logAudit({
      actorId: session.user.id,
      action: "PAYOUT_PROCESSED",
      subject: `Payout:${payout.id}`,
      metadata: parsed.data,
    });

    payoutsLog.info(
      { payoutId: payout.id, action: parsed.data.action, by: session.user.id },
      "admin payout state change",
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
