/*
  Warnings:

  - You are about to drop the column `stripePaymentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[providerPaymentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "Payment_stripePaymentId_key";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'RUB';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripePaymentId",
ADD COLUMN     "buyerEmail" TEXT,
ADD COLUMN     "buyerId" TEXT,
ADD COLUMN     "confirmationUrl" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "providerId" TEXT NOT NULL DEFAULT 'yookassa',
ADD COLUMN     "providerPaymentId" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'RUB';

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "currency" SET DEFAULT 'RUB';

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookEvent_providerId_eventType_idx" ON "WebhookEvent"("providerId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_providerId_providerEventId_key" ON "WebhookEvent"("providerId", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_providerId_idx" ON "Payment"("providerId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
