import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

const AUTO_COMPLETE_WINDOW_DAYS = 14;

export function assertCronAuth(req: Request) {
  // CRON_SECRET is required in prod (enforced in env.ts). In dev we allow no
  // secret so local invocations work.
  const required = env.CRON_SECRET;
  if (!required) return;
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${required}`) {
    throw new ApiError(401, "Unauthorized");
  }
}

/**
 * §6.1 — auto-complete orders that have been DELIVERED but never confirmed by
 * the buyer for {@link AUTO_COMPLETE_WINDOW_DAYS} days. Funds move from
 * pendingBalance → availableBalance.
 */
export async function autoCompleteStaleOrders(now = new Date()) {
  const cutoff = new Date(now.getTime() - AUTO_COMPLETE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      deliveredAt: { lte: cutoff },
    },
    include: { commissionRecord: true },
    take: 500,
  });
  let processed = 0;
  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.order.findUnique({ where: { id: order.id } });
      if (!fresh || fresh.status !== "DELIVERED") return;
      await tx.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      if (order.commissionRecord) {
        await tx.sellerProfile.update({
          where: { id: order.commissionRecord.sellerId },
          data: {
            pendingBalance: { decrement: order.commissionRecord.sellerEarningsCents },
            availableBalance: { increment: order.commissionRecord.sellerEarningsCents },
          },
        });
      }
      processed += 1;
    });
  }
  return { processed, total: stale.length };
}

/**
 * §6.1 — reconcile PENDING payments that are stuck. YooKassa sometimes
 * silently drops webhooks (5xx, network blip); the cron polls every PENDING
 * payment older than 5 minutes via the PSP API and updates state accordingly.
 *
 * The actual provider polling is left as a stub — the YooKassa SDK we removed
 * in Phase 3 had a `getPayment(id)` call that we'd add to the YooKassaProvider
 * here. For now the cron just lists stuck candidates so monitoring catches
 * the situation.
 */
export async function listStuckPayments(now = new Date()) {
  const cutoff = new Date(now.getTime() - 5 * 60 * 1000);
  return prisma.payment.findMany({
    where: { status: "PENDING", createdAt: { lte: cutoff } },
    select: { id: true, providerId: true, providerPaymentId: true, orderId: true, createdAt: true },
    take: 200,
  });
}

/**
 * §6.7 — purge expired or consumed tokens older than 30 days.
 */
export async function purgeExpiredTokens(now = new Date()) {
  const olderThan = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ev = await prisma.emailVerificationToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: now } }, { consumedAt: { lt: olderThan } }],
    },
  });
  const pr = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: now } }, { consumedAt: { lt: olderThan } }],
    },
  });
  return { emailVerification: ev.count, passwordReset: pr.count };
}
