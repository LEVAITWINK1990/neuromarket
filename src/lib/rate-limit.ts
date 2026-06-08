// TZ §6.4 — rate limiting.
//
// Design:
//   * A `RateLimiter` is keyed by *name* (e.g. "sign-up") + *bucket* (e.g.
//     the caller's IP). Two back-ends:
//       - In-process Map with cleanup (zero-deps, fine for single instance,
//         lossy in serverless multi-instance).
//       - Upstash Redis REST (optional, switches on automatically when
//         UPSTASH_REDIS_REST_URL + _TOKEN are present in env).
//   * Limiters use a *fixed window* algorithm:
//       - bucket key embeds the floor(now / windowMs) so each window has a
//         distinct counter.
//       - Redis: INCR + EXPIRE (PX) atomically via the REST pipeline.
//       - Memory: increment in-place, evict expired entries on read.
//   * Callers use `requireRateLimit(rl.signUp, identifier)`. On exhaustion
//     a `RateLimitError` is thrown (HTTP 429-mapped via toApiResponse).
//   * Each limiter exposes static config so docs/tests can introspect the
//     window/limit pair.

// Note: we deliberately read process.env directly rather than going through
// @/lib/env so the rate-limit primitive stays usable in unit tests that don't
// set the full env (DATABASE_URL, NEXTAUTH_SECRET, ...). The Upstash REST
// back-end is opt-in; when absent we fall back to in-process memory.

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
}

export class RateLimitError extends Error {
  readonly status = 429;
  constructor(
    readonly limiterName: string,
    readonly retryAfterMs: number,
  ) {
    super(`Rate limit exceeded for ${limiterName}; retry in ${retryAfterMs}ms`);
  }
}

interface Backend {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

// ---------- In-memory backend ----------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

class MemoryBackend implements Backend {
  private readonly store = new Map<string, Bucket>();
  private lastSweep = 0;

  private sweep(now: number): void {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [k, b] of this.store) {
      if (b.resetAt <= now) this.store.delete(k);
    }
  }

  async hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    this.sweep(now);
    const window = Math.floor(now / windowMs);
    const composite = `${key}:${window}`;
    const resetAt = (window + 1) * windowMs;
    const existing = this.store.get(composite);
    if (!existing) {
      this.store.set(composite, { count: 1, resetAt });
      return { ok: true, remaining: limit - 1, retryAfterMs: 0, limit };
    }
    existing.count += 1;
    if (existing.count > limit) {
      return { ok: false, remaining: 0, retryAfterMs: existing.resetAt - now, limit };
    }
    return { ok: true, remaining: Math.max(0, limit - existing.count), retryAfterMs: 0, limit };
  }
}

// ---------- Upstash REST backend -------------------------------------------

class UpstashBackend implements Backend {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async pipeline(
    commands: unknown[][],
  ): Promise<Array<{ result?: unknown; error?: string }>> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upstash pipeline failed: ${res.status} ${text}`);
    }
    return (await res.json()) as Array<{ result?: unknown; error?: string }>;
  }

  async hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const composite = `rl:${key}:${window}`;
    const resetAt = (window + 1) * windowMs;
    const replies = await this.pipeline([
      ["INCR", composite],
      ["PEXPIRE", composite, String(windowMs)],
    ]);
    const incrRaw = replies[0]?.result;
    const count = typeof incrRaw === "number" ? incrRaw : Number(incrRaw ?? 0);
    if (count > limit) {
      return { ok: false, remaining: 0, retryAfterMs: resetAt - now, limit };
    }
    return { ok: true, remaining: Math.max(0, limit - count), retryAfterMs: 0, limit };
  }
}

// ---------- Backend selection ----------------------------------------------

let backendInstance: Backend | null = null;

function backend(): Backend {
  if (backendInstance) return backendInstance;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    backendInstance = new UpstashBackend(url, token);
  } else {
    backendInstance = new MemoryBackend();
  }
  return backendInstance;
}

/** Test-only seam. */
export function _setRateLimitBackend(b: Backend | null): void {
  backendInstance = b;
}

// ---------- Public limiter definitions -------------------------------------

export interface Limiter {
  name: string;
  limit: number;
  windowMs: number;
  check(identifier: string): Promise<RateLimitResult>;
}

function defineLimiter(name: string, limit: number, windowMs: number): Limiter {
  return {
    name,
    limit,
    windowMs,
    check(identifier) {
      return backend().hit(`${name}:${identifier}`, limit, windowMs);
    },
  };
}

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const DAY = 24 * HOUR;

export const rl = {
  signUp: defineLimiter("sign-up", 5, HOUR),
  signIn: defineLimiter("sign-in", 10, 10 * MINUTE),
  passwordReset: defineLimiter("password-reset", 5, HOUR),
  emailVerification: defineLimiter("email-verification", 5, HOUR),
  checkout: defineLimiter("checkout", 20, HOUR),
  messages: defineLimiter("messages", 30, MINUTE),
  reports: defineLimiter("reports", 10, DAY),
  productCreate: defineLimiter("product-create", 20, DAY),
  reviews: defineLimiter("reviews", 20, DAY),
  payouts: defineLimiter("payouts", 5, DAY),
} satisfies Record<string, Limiter>;

/**
 * Enforce a limiter; throws RateLimitError on exhaustion. Caller is responsible
 * for mapping the error to HTTP 429 via toApiResponse().
 */
export async function requireRateLimit(limiter: Limiter, identifier: string): Promise<void> {
  const res = await limiter.check(identifier);
  if (!res.ok) {
    throw new RateLimitError(limiter.name, res.retryAfterMs);
  }
}

/** Derive a stable identifier from a Next.js request. */
export function rateLimitKey(req: Request, userId?: string | null): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return userId ? `${ip}:${userId}` : ip;
}
