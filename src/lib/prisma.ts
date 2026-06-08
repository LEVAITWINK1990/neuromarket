import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// §7.5 — runtime uses the pooled connection when one is configured (Vercel /
// serverless), falling back to the direct DATABASE_URL otherwise. We read
// process.env directly here instead of going through src/lib/env.ts to avoid
// a circular import: prisma is imported by env's downstream consumers.
const runtimeUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: runtimeUrl ? { db: { url: runtimeUrl } } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
