// TZ §9.2 — structured logging.
//
// Thin wrapper around pino. We always emit raw JSON lines so collectors
// (CloudWatch / Vercel / Datadog / Sentry) can index them directly. In Next.js
// `pino-pretty` cannot be used as a `transport` target because the Next bundler
// can't resolve the worker-thread file at runtime — it throws
// `default level: must be included in custom levels` (see issue vercel/next.js).
// If you want pretty output locally, pipe stdout: `npm run dev | npx pino-pretty`.
//
// We never log secret values: callers must strip credentials before passing
// objects to the logger. `redact` covers obvious slip-ups for `password`,
// `token`, `secret`, and the YooKassa Idempotence-Key header.

import pino from "pino";
import type { Logger } from "pino";

const isDev = process.env.NODE_ENV === "development";

// LOG_LEVEL may legitimately arrive as an empty string from a copied `.env`
// template — `??` would forward "" straight into pino, which then fails with
// `default level: must be included in custom levels` at module load time
// (breaks `next build` because page-data collection imports route modules).
// Treat empty / whitespace-only as unset.
const envLevel = process.env.LOG_LEVEL?.trim();

export const logger: Logger = pino({
  level: envLevel && envLevel.length > 0 ? envLevel : isDev ? "debug" : "info",
  base: {
    service: "neuromarket",
    env: process.env.NODE_ENV ?? "development",
  },
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "secret",
      "apiKey",
      "authorization",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.secret",
      "*.apiKey",
      "*.authorization",
      "headers.authorization",
      "headers.cookie",
      "headers['x-yookassa-signature']",
      "headers['idempotence-key']",
    ],
    censor: "[REDACTED]",
  },
});

/** Convenience wrapper that always adds a `where` field. */
export function scoped(where: string): Logger {
  return logger.child({ where });
}
