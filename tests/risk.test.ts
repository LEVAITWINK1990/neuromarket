import { describe, expect, it } from "vitest";
import { computeRiskScore, isHighRisk, HIGH_RISK_THRESHOLD } from "@/lib/risk";

const baseInput = {
  title: "AI Writing Voucher Pro",
  description: "Official voucher for AI Writing tool. Valid for 1 month.",
  priceCents: 2_999,
  productType: "VOUCHER_CODE",
  deliveryType: "INSTANT",
  isSellerVerified: true,
};

describe("computeRiskScore", () => {
  it("returns 0 for a clean verified listing", () => {
    expect(computeRiskScore(baseInput)).toBe(0);
  });

  it("flags listings with suspicious keywords as high risk", () => {
    const score = computeRiskScore({
      ...baseInput,
      title: "Cracked AI software",
      description: "Get the cracked version, no warranty.",
    });
    expect(score).toBeGreaterThanOrEqual(HIGH_RISK_THRESHOLD);
    expect(isHighRisk(score)).toBe(true);
  });

  it("penalizes unverified sellers", () => {
    expect(
      computeRiskScore({ ...baseInput, isSellerVerified: false }),
    ).toBeGreaterThan(0);
  });

  it("flags unrealistically low prices", () => {
    const score = computeRiskScore({ ...baseInput, priceCents: 50 });
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it("flags manual delivery of license keys", () => {
    const score = computeRiskScore({
      ...baseInput,
      productType: "LICENSE_KEY",
      deliveryType: "MANUAL",
    });
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it("escalates with report count", () => {
    const score = computeRiskScore({ ...baseInput, reportCount: 5 });
    expect(score).toBeGreaterThanOrEqual(40);
  });

  it("caps at 100", () => {
    const score = computeRiskScore({
      ...baseInput,
      title: "cracked stolen leaked nulled keygen",
      description: "shared account telegram only no warranty warez",
      reportCount: 999,
      isSellerVerified: false,
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});
