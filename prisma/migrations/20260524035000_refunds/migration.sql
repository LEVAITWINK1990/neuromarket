-- §5.3 Refund flow. Adds:
--   - PaymentStatus.PARTIALLY_REFUNDED
--   - Refund model + RefundStatus + RefundInitiator enums
--   - Payment.refundedAmountCents
-- Idempotency: Refund.idempotencyKey UNIQUE, Refund.providerRefundId UNIQUE.

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';

CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'CANCELED', 'FAILED');
CREATE TYPE "RefundInitiator" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'SYSTEM');

ALTER TABLE "Payment" ADD COLUMN "refundedAmountCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL DEFAULT 'yookassa',
    "providerRefundId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "initiator" "RefundInitiator" NOT NULL,
    "reason" TEXT NOT NULL,
    "initiatedById" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "succeededAt" TIMESTAMP(3),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");
CREATE UNIQUE INDEX "Refund_providerRefundId_key" ON "Refund"("providerRefundId");
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");
CREATE INDEX "Refund_status_idx" ON "Refund"("status");
CREATE INDEX "Refund_providerId_idx" ON "Refund"("providerId");

ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REFUND_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REFUND_SUCCEEDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REFUND_FAILED';
