import { z } from "zod";

// Centralised, type-safe access to process.env. Validation runs lazily on the
// first read so test environments can stub specific keys.

const booleanish = z
  .union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
  .transform((v) => v === "true" || v === "1");

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // §7.5 — DATABASE_URL is the direct connection (used by `prisma migrate`
  // and any process that needs to open more than 1 connection). On
  // serverless (Vercel) you usually also want a pooled connection
  // (pgbouncer / Prisma Accelerate / Neon's pooler) for runtime queries to
  // survive cold-start fan-out. DATABASE_URL_POOLED is optional; when set,
  // src/lib/prisma.ts uses it for the PrismaClient runtime datasource and
  // keeps DATABASE_URL for migrations.
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_URL_POOLED: z.string().optional(),

  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 chars"),
  NEXTAUTH_URL: z.string().url().optional(),

  APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // YooKassa
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  YOOKASSA_MODE: z.enum(["test", "live"]).default("test"),

  // Commission tuning (passed through to commission math)
  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).default(10),
  PROCESSING_FEE_PERCENT: z.coerce.number().min(0).max(100).default(2.9),
  PROCESSING_FEE_FIXED_CENTS: z.coerce.number().int().min(0).default(30),

  // Email (TZ §6.6). EMAIL_FROM is required when EMAIL_PROVIDER != "console".
  EMAIL_PROVIDER: z.enum(["console", "resend", "smtp"]).default("console"),
  EMAIL_FROM: z.string().optional(),
  EMAIL_RESEND_API_KEY: z.string().optional(),
  EMAIL_SMTP_URL: z.string().optional(),

  // Cron (TZ §6.1) — bearer token for the cron HTTP entrypoints. Required
  // outside development.
  CRON_SECRET: z.string().optional(),

  // Encryption keys (TZ §6.2). Format: "1:<secret1>;2:<secret2>". Newest
  // version highest. Validated lazily by src/lib/crypto.ts.
  ENCRYPTION_KEYS: z.string().optional(),

  // Storage (TZ §6.5). "local" writes to ./uploads/ (dev only). "s3" supports
  // any S3-compatible service (AWS S3, Cloudflare R2, Yandex Object Storage).
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_S3_ENDPOINT: z.string().url().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_SECRET_KEY: z.string().optional(),

  // Rate limiting (TZ §6.4). Optional Upstash REST credentials enable the
  // distributed back-end. Without them the in-process memory store is used.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Observability (TZ §9). All optional — Sentry/pino degrade gracefully.
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),

  // OAuth providers (optional). Each is fully wired when its credentials are
  // present; the sign-in page hides the corresponding button when they're not.
  // - Google: created at https://console.cloud.google.com/apis/credentials.
  //   Redirect URI: <APP_URL>/api/auth/callback/google
  // - Apple: requires Apple Developer Program ($99/yr). APPLE_PRIVATE_KEY is
  //   the contents of the .p8 file (multiline OK). APPLE_CLIENT_ID is the
  //   Services ID. NextAuth signs a JWT with these to authenticate with Apple.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),

  // Toggles
  DISABLE_ENV_VALIDATION: booleanish.optional(),
});

export type Env = z.infer<typeof baseSchema>;

let cached: Env | null = null;

function readEnv(): Env {
  if (cached) return cached;

  const raw = baseSchema.safeParse(process.env);
  if (!raw.success) {
    const issues = raw.error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const parsed = raw.data;

  // Hard checks that should kill the boot in production.
  if (parsed.NODE_ENV === "production") {
    if (parsed.NEXTAUTH_SECRET === "please-change-me-in-production") {
      throw new Error("NEXTAUTH_SECRET must be rotated before production deploy (TZ \u00a75.8).");
    }
    if (!parsed.YOOKASSA_SHOP_ID || !parsed.YOOKASSA_SECRET_KEY) {
      throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are required in production.");
    }
    if (parsed.YOOKASSA_MODE === "live" && parsed.YOOKASSA_SECRET_KEY.startsWith("test_")) {
      throw new Error("YOOKASSA_MODE=live but the configured key is a test_* key.");
    }
    if (parsed.EMAIL_PROVIDER !== "console" && !parsed.EMAIL_FROM) {
      throw new Error("EMAIL_FROM is required when EMAIL_PROVIDER is not 'console'");
    }
    if (parsed.EMAIL_PROVIDER === "resend" && !parsed.EMAIL_RESEND_API_KEY) {
      throw new Error("EMAIL_RESEND_API_KEY is required for EMAIL_PROVIDER=resend");
    }
    if (parsed.EMAIL_PROVIDER === "smtp" && !parsed.EMAIL_SMTP_URL) {
      throw new Error("EMAIL_SMTP_URL is required for EMAIL_PROVIDER=smtp");
    }
    if (!parsed.CRON_SECRET) {
      throw new Error("CRON_SECRET must be set in production (TZ §6.1).");
    }
    if (!parsed.ENCRYPTION_KEYS) {
      throw new Error("ENCRYPTION_KEYS must be set in production (TZ §6.2).");
    }
    if (parsed.STORAGE_PROVIDER === "s3") {
      const missing = (
        [
          "STORAGE_S3_ENDPOINT",
          "STORAGE_S3_REGION",
          "STORAGE_S3_BUCKET",
          "STORAGE_S3_ACCESS_KEY",
          "STORAGE_S3_SECRET_KEY",
        ] as const
      ).filter((k) => !parsed[k]);
      if (missing.length) {
        throw new Error(`STORAGE_PROVIDER=s3 requires: ${missing.join(", ")}`);
      }
    }
  }

  cached = parsed;
  return parsed;
}

// Public accessor. We intentionally do not export the schema-parsed object
// directly so callers cannot accidentally mutate it.
export const env = new Proxy({} as Env, {
  get(_target, key: string) {
    return readEnv()[key as keyof Env];
  },
});

/** For tests only. */
export function resetEnvCache(): void {
  cached = null;
}
