import { describe, expect, it } from "vitest";
import { ipInAllowlist, YOOKASSA_WEBHOOK_IPS, YooKassaProvider } from "@/lib/payments";

describe("ipInAllowlist", () => {
  it("accepts ipv4 inside a CIDR", () => {
    expect(ipInAllowlist("185.71.76.15")).toBe(true); // 185.71.76.0/27 covers .0-.31
  });

  it("rejects ipv4 outside the CIDR", () => {
    expect(ipInAllowlist("185.71.76.40")).toBe(false); // outside /27
    expect(ipInAllowlist("8.8.8.8")).toBe(false);
  });

  it("accepts exact-match host", () => {
    expect(ipInAllowlist("77.75.156.11")).toBe(true);
    expect(ipInAllowlist("77.75.156.12")).toBe(false);
  });

  it("rejects empty / nullish inputs", () => {
    expect(ipInAllowlist(null)).toBe(false);
    expect(ipInAllowlist(undefined)).toBe(false);
    expect(ipInAllowlist("")).toBe(false);
    expect(ipInAllowlist("   ")).toBe(false);
  });

  it("handles ipv6 prefixes", () => {
    expect(ipInAllowlist("2a02:5180:0:1509::1")).toBe(true);
    expect(ipInAllowlist("2a02:5180:0:9999::1")).toBe(false);
  });

  it("uses the exported allowlist by default", () => {
    expect(YOOKASSA_WEBHOOK_IPS.length).toBeGreaterThan(0);
  });
});

describe("YooKassaProvider.verifyWebhook", () => {
  const provider = new YooKassaProvider({ shopId: "1", secretKey: "test_x" });

  it("trusts requests from allowlisted IPs", () => {
    const ok = provider.verifyWebhook({
      headers: new Headers({}),
      ip: "185.71.76.5",
      rawBody: "{}",
    });
    expect(ok).toBe(true);
  });

  it("falls back to x-forwarded-for left-most entry", () => {
    const ok = provider.verifyWebhook({
      headers: new Headers({ "x-forwarded-for": "77.75.156.11, 10.0.0.1" }),
      ip: null,
      rawBody: "{}",
    });
    expect(ok).toBe(true);
  });

  it("rejects untrusted IPs even with forwarded header", () => {
    const ok = provider.verifyWebhook({
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      ip: "1.2.3.4",
      rawBody: "{}",
    });
    expect(ok).toBe(false);
  });
});

describe("YooKassaProvider.parseWebhookEvent", () => {
  const provider = new YooKassaProvider({ shopId: "1", secretKey: "test_x" });

  it("parses payment.succeeded with amount in cents", () => {
    const body = JSON.stringify({
      event: "payment.succeeded",
      object: {
        id: "2c85e8e1-000f-5000-9000-1d8b3d3d3d3d",
        amount: { value: "1500.00", currency: "RUB" },
        metadata: { orderId: "ord_1", buyerId: "usr_1" },
      },
    });
    const parsed = provider.parseWebhookEvent(body);
    expect(parsed.eventType).toBe("payment.succeeded");
    expect(parsed.providerPaymentId).toBe("2c85e8e1-000f-5000-9000-1d8b3d3d3d3d");
    expect(parsed.amountCents).toBe(150_000);
    expect(parsed.currency).toBe("RUB");
    expect(parsed.metadata?.orderId).toBe("ord_1");
  });

  it("classifies unknown event types as 'unknown' instead of throwing", () => {
    const body = JSON.stringify({
      event: "payment.frobnicated",
      object: { id: "p_x", amount: { value: "1.00", currency: "RUB" } },
    });
    const parsed = provider.parseWebhookEvent(body);
    expect(parsed.eventType).toBe("unknown");
  });

  it("maps refund.succeeded to providerRefundId+providerPaymentId", () => {
    const body = JSON.stringify({
      event: "refund.succeeded",
      object: {
        id: "rf_1",
        payment_id: "pay_1",
        amount: { value: "50.00", currency: "RUB" },
      },
    });
    const parsed = provider.parseWebhookEvent(body);
    expect(parsed.eventType).toBe("refund.succeeded");
    expect(parsed.providerRefundId).toBe("rf_1");
    expect(parsed.providerPaymentId).toBe("pay_1");
    expect(parsed.amountCents).toBe(5000);
  });

  it("throws ProviderError on non-JSON body", () => {
    expect(() => provider.parseWebhookEvent("nope")).toThrow();
  });
});
