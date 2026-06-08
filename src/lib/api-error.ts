import { NextResponse } from "next/server";

import { RateLimitError } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Thrown by guards / route helpers when the request should fail with a
 * specific HTTP status. Route handlers can either catch & translate via
 * {@link toApiResponse} or let it bubble — the global error handler converts
 * it for them.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Convert a thrown error into a JSON response with the right status code. */
export function toApiResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.message, code: err.code ?? null },
      { status: err.status },
    );
  }
  if (err instanceof RateLimitError) {
    // TZ §6.4 — surface the retry hint to the client via the standard
    // Retry-After header (seconds, per RFC 7231) plus a JSON body.
    const retryAfter = Math.max(1, Math.ceil(err.retryAfterMs / 1000));
    return NextResponse.json(
      {
        error: "Слишком много запросов. Попробуйте позже.",
        code: "RATE_LIMITED",
        retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }
  if (err instanceof Error) {
    // §9.2 — every uncaught error in a route bubbles through here; record it
    // with a stack trace so the observability pipeline can surface it. Sentry
    // (when configured) catches the same throw via @sentry/nextjs.
    logger.error({ err: { name: err.name, message: err.message, stack: err.stack } }, "API 500");
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  logger.error({ err }, "API 500 (non-Error)");
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
