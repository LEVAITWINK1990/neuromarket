-- §7.2 — admin payouts UI needs operator audit trail and external txn id.
-- All four columns are nullable so the migration is back-compat for existing
-- PENDING / REQUESTED rows (no backfill required).

ALTER TABLE "Payout"
  ADD COLUMN     "externalTxnId" TEXT,
  ADD COLUMN     "processedById" TEXT,
  ADD COLUMN     "processedAt"   TIMESTAMP(3),
  ADD COLUMN     "failureReason" TEXT;

ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_processedById_fkey"
    FOREIGN KEY ("processedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Payout_status_idx" ON "Payout"("status");
CREATE INDEX "Payout_processedById_idx" ON "Payout"("processedById");
