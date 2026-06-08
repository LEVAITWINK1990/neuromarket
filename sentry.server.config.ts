// TZ §9.1 — Sentry server-side initialisation.
//
// Loaded automatically by @sentry/nextjs from project root. No-op when
// SENTRY_DSN is not set (dev / preview deploys).

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enabled: true,
    // Lock down what we report — Sentry shouldn't leak PII even by accident.
    sendDefaultPii: false,
  });
}
