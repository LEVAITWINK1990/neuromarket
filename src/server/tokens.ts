import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function generateToken(): { plain: string; hash: string } {
  const plain = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(plain).digest("hex");
  return { plain, hash };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: string, email: string) {
  const { plain, hash } = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hash,
      email,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });
  return plain;
}

export async function createPasswordResetToken(userId: string) {
  const { plain, hash } = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });
  return plain;
}

export async function consumeEmailVerificationToken(plainToken: string) {
  const hash = hashToken(plainToken);
  return prisma.$transaction(async (tx) => {
    const row = await tx.emailVerificationToken.findUnique({ where: { tokenHash: hash } });
    if (!row) return null;
    if (row.consumedAt) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    await tx.emailVerificationToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
    await tx.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    });
    return row;
  });
}

export async function consumePasswordResetToken(plainToken: string, newPasswordHash: string) {
  const hash = hashToken(plainToken);
  return prisma.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findUnique({ where: { tokenHash: hash } });
    if (!row) return null;
    if (row.consumedAt) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash: newPasswordHash },
    });
    return row;
  });
}
