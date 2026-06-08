// TZ §6.4 — sanity tests for the rate-limit primitive. We exercise the
// in-process memory back-end directly; the Upstash REST back-end is covered
// by integration tests against a real instance (not run in CI).

import { describe, expect, it, beforeEach } from "vitest";
import { rl, requireRateLimit, RateLimitError, _setRateLimitBackend } from "@/lib/rate-limit";

beforeEach(() => {
  // Force the memory back-end fresh between tests.
  _setRateLimitBackend(null);
});

describe("rate-limit memory backend", () => {
  it("permits up to the configured limit per identifier", async () => {
    const limiter = rl.signUp;
    const id = "ip-1";
    for (let i = 0; i < limiter.limit; i += 1) {
      await expect(requireRateLimit(limiter, id)).resolves.toBeUndefined();
    }
    await expect(requireRateLimit(limiter, id)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("isolates buckets by identifier", async () => {
    const limiter = rl.messages;
    const a = "ip-a";
    const b = "ip-b";
    for (let i = 0; i < limiter.limit; i += 1) {
      await expect(limiter.check(a)).resolves.toMatchObject({ ok: true });
    }
    await expect(limiter.check(a)).resolves.toMatchObject({ ok: false });
    // bucket B is unaffected
    const res = await limiter.check(b);
    expect(res.ok).toBe(true);
    expect(res.remaining).toBe(limiter.limit - 1);
  });

  it("surfaces a positive retry-after on exhaustion", async () => {
    const limiter = rl.passwordReset;
    const id = "ip-retry";
    for (let i = 0; i < limiter.limit; i += 1) {
      await limiter.check(id);
    }
    const blocked = await limiter.check(id);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(limiter.windowMs);
  });
});
