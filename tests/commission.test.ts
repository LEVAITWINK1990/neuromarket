import { describe, expect, it } from "vitest";
import {
  calculateOrderTotals,
  calculateSellerPayout,
  DEFAULT_FEE_CONFIG,
} from "@/lib/commission";

describe("calculateOrderTotals", () => {
  it("returns zeroes for an empty cart", () => {
    expect(calculateOrderTotals([])).toEqual({
      subtotalCents: 0,
      platformFeeCents: 0,
      processingFeeCents: 0,
      sellerEarningsCents: 0,
      totalCents: 0,
    });
  });

  it("applies platform fee + processing fee for a single line", () => {
    const r = calculateOrderTotals(
      [{ priceCents: 10_000, quantity: 1 }],
      { platformFeePercent: 10, processingFeePercent: 2.9, processingFeeFixedCents: 30 },
    );
    expect(r.subtotalCents).toBe(10_000);
    expect(r.platformFeeCents).toBe(1_000); // 10%
    expect(r.processingFeeCents).toBe(290 + 30); // 2.9% + 30c
    expect(r.sellerEarningsCents).toBe(10_000 - 1_000 - 320);
    expect(r.totalCents).toBe(10_000);
  });

  it("sums multiple lines and quantities", () => {
    const r = calculateOrderTotals([
      { priceCents: 2_500, quantity: 2 },
      { priceCents: 1_000, quantity: 3 },
    ]);
    expect(r.subtotalCents).toBe(2_500 * 2 + 1_000 * 3);
  });

  it("never produces negative seller earnings", () => {
    const r = calculateOrderTotals(
      [{ priceCents: 50, quantity: 1 }],
      { platformFeePercent: 10, processingFeePercent: 2.9, processingFeeFixedCents: 30 },
    );
    expect(r.sellerEarningsCents).toBeGreaterThanOrEqual(0);
  });

  it("rejects negative or zero inputs", () => {
    expect(() =>
      calculateOrderTotals([{ priceCents: -1, quantity: 1 }]),
    ).toThrow(/non-negative/);
    expect(() =>
      calculateOrderTotals([{ priceCents: 100, quantity: 0 }]),
    ).toThrow(/positive/);
  });

  it("uses defaults when no config passed", () => {
    const r = calculateOrderTotals([{ priceCents: 10_000, quantity: 1 }]);
    expect(r.platformFeeCents).toBe(
      Math.round((10_000 * DEFAULT_FEE_CONFIG.platformFeePercent) / 100),
    );
  });
});

describe("calculateSellerPayout", () => {
  it("returns pending amount when no adjustment", () => {
    expect(calculateSellerPayout(5_000)).toBe(5_000);
  });

  it("applies negative adjustments (e.g. refund)", () => {
    expect(calculateSellerPayout(5_000, -1_000)).toBe(4_000);
  });

  it("clamps to zero when refund exceeds pending", () => {
    expect(calculateSellerPayout(1_000, -5_000)).toBe(0);
  });

  it("rejects negative pending", () => {
    expect(() => calculateSellerPayout(-1)).toThrow(/non-negative/);
  });
});
