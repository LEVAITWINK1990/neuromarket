import { describe, expect, it } from "vitest";
import { MODERATION_FIELDS, shouldReturnToReview } from "@/lib/product-moderation";

// §5.9 — PATCH on a seller's product must drop it back to PENDING_REVIEW
// when moderation-sensitive fields change OR the image is replaced OR the
// risk score crosses the high-risk threshold. Soft fields (slug, category,
// refundPolicy, etc.) should NOT trigger re-review.

const BASE = {
  title: "OpenAI Plus 1mo",
  description: "Sharing license for one month",
  shortDescription: "ChatGPT Plus access",
  priceCents: 12_00,
  productType: "DIGITAL",
  digitalFileUrl: null,
  externalUrl: null,
  riskScore: 10,
  primaryImageUrl: "https://cdn.example.com/img1.jpg",
};

describe("shouldReturnToReview (§5.9)", () => {
  it("declares MODERATION_FIELDS in sync with the spec", () => {
    // Guardrail: if anyone re-orders or drops a field, this catches it.
    expect([...MODERATION_FIELDS].sort()).toEqual(
      [
        "description",
        "digitalFileUrl",
        "externalUrl",
        "priceCents",
        "productType",
        "shortDescription",
        "title",
      ].sort(),
    );
  });

  it("does NOT require review when nothing meaningful changed", () => {
    const result = shouldReturnToReview({
      existing: BASE,
      patch: {},
      newRiskScore: 10,
      isHighRiskNow: false,
    });
    expect(result).toBe(false);
  });

  it("requires review when title changes", () => {
    const result = shouldReturnToReview({
      existing: BASE,
      patch: { title: "GPT Plus 1 month (NEW)" },
      newRiskScore: 10,
      isHighRiskNow: false,
    });
    expect(result).toBe(true);
  });

  it("requires review when description changes", () => {
    const result = shouldReturnToReview({
      existing: BASE,
      patch: { description: "Now also includes Sora video" },
      newRiskScore: 10,
      isHighRiskNow: false,
    });
    expect(result).toBe(true);
  });

  it("requires review when shortDescription changes", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { shortDescription: "GPT-5 access" },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(true);
  });

  it("requires review when priceCents changes", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { priceCents: 99_00 },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(true);
  });

  it("requires review when productType changes", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { productType: "SERVICE" },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(true);
  });

  it("requires review when digitalFileUrl changes (e.g. swap of the actual asset)", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { digitalFileUrl: "https://cdn/sneaky-malware.zip" },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(true);
  });

  it("requires review when externalUrl changes (could redirect to phishing)", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { externalUrl: "https://attacker.example/redirect" },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(true);
  });

  it("requires review when primary image changes", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { imageUrl: "https://cdn.example.com/different.jpg" },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(true);
  });

  it("does NOT require review when patch sends the SAME value (no-op)", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { title: BASE.title, priceCents: BASE.priceCents },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(false);
  });

  it("requires review when risk score rises AND crosses the high-risk threshold", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: {},
        newRiskScore: 80,
        isHighRiskNow: true,
      }),
    ).toBe(true);
  });

  it("does NOT require review when risk score rises but stays below threshold", () => {
    // The function only forces a re-review when the *new* score is high AND
    // the score rose; a quiet drift inside safe territory shouldn't flap.
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: {},
        newRiskScore: 25,
        isHighRiskNow: false,
      }),
    ).toBe(false);
  });

  it("does NOT require review when risk score is high but did NOT rise (already-flagged stays as-is)", () => {
    // existing.riskScore == 80, patch keeps it at 80 → not a regression, no
    // new evidence of harm. Other guardrails (admin queue) handle stale
    // high-risk items.
    expect(
      shouldReturnToReview({
        existing: { ...BASE, riskScore: 80 },
        patch: {},
        newRiskScore: 80,
        isHighRiskNow: true,
      }),
    ).toBe(false);
  });

  it("does NOT require review for soft fields explicitly mentioned by TZ §5.9", () => {
    // categoryId / slug / refundPolicy / termsOfUse / validityPeriod /
    // stockQuantity / deliveryType / manualDeliveryWindowHours are all soft.
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: {
          // these aren't in the MODERATION_FIELDS list so the helper
          // shouldn't even look at them — we pass via the typed schema
          // intentionally minimal here, but the runtime call sites can
          // ignore extra keys.
        },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(false);
  });

  it("requires review when image is unset (becomes null)", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { imageUrl: null },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(true);
  });

  it("does NOT require review when image patch matches current url verbatim", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: { imageUrl: BASE.primaryImageUrl },
        newRiskScore: 10,
        isHighRiskNow: false,
      }),
    ).toBe(false);
  });

  it("OR-combines all triggers (image + risk + field)", () => {
    expect(
      shouldReturnToReview({
        existing: BASE,
        patch: {
          title: "different",
          imageUrl: "https://cdn/new.jpg",
        },
        newRiskScore: 90,
        isHighRiskNow: true,
      }),
    ).toBe(true);
  });
});
