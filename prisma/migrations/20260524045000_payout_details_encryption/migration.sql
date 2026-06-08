-- §6.2 — Payout.detailsEncrypted stores AES-256-GCM ciphertext for
-- bank/card details. The plaintext blob is a JSON object handled exclusively
-- by src/lib/crypto.ts; the DB never sees the cleartext.

ALTER TABLE "Payout" ADD COLUMN "detailsEncrypted" TEXT;
