import { describe, expect, it } from "vitest";
import { computeRefundBalanceDeltas } from "@/server/refunds";

// §5.4 — balance state machine for refunds. The runtime call lives in
// finalizeRefundSucceeded(); the helper is pure so we can exercise every
// branch without spinning up Prisma.

describe("computeRefundBalanceDeltas (§5.4)", () => {
  it("decrements pendingBalance for PAID orders", () => {
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "PAID",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 1000,
      availableBalance: 0,
    });
    expect(deltas).toEqual({ fromPending: 850, fromAvailable: 0, fromWithdrawn: 0 });
  });

  it("decrements pendingBalance for DELIVERED orders", () => {
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "DELIVERED",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 1000,
      availableBalance: 999_999,
    });
    expect(deltas.fromPending).toBe(850);
    expect(deltas.fromAvailable).toBe(0);
    expect(deltas.fromWithdrawn).toBe(0);
  });

  it("decrements availableBalance when funds are still there (COMPLETED)", () => {
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "COMPLETED",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 1000,
      availableBalance: 5000,
    });
    expect(deltas).toEqual({ fromPending: 0, fromAvailable: 850, fromWithdrawn: 0 });
  });

  it("falls back to withdrawn when payout already drained available (debt path)", () => {
    // Seller earned 850 on this order, but already withdrew everything;
    // available is now 200. Refund of 1000 must charge:
    //   200 from available
    //   650 from withdrawn (goes negative → seller owes platform)
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "COMPLETED",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 1000,
      availableBalance: 200,
    });
    expect(deltas.fromAvailable).toBe(200);
    expect(deltas.fromWithdrawn).toBe(650);
    expect(deltas.fromAvailable + deltas.fromWithdrawn).toBe(850);
    expect(deltas.fromPending).toBe(0);
  });

  it("scales earnings delta proportionally on partial refund (50%)", () => {
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "PAID",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 500, // 50% partial
      availableBalance: 0,
    });
    // 50% of 850 = 425
    expect(deltas.fromPending).toBe(425);
  });

  it("scales earnings delta proportionally on partial refund of COMPLETED order", () => {
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "COMPLETED",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 300, // 30% partial
      availableBalance: 1000,
    });
    // 30% of 850 = 255 → fully covered by available
    expect(deltas.fromAvailable).toBe(255);
    expect(deltas.fromWithdrawn).toBe(0);
  });

  it("handles already-REFUNDED order status (further partial refunds still walk available/withdrawn)", () => {
    // The order can sit in REFUNDED if the first refund flipped it; a
    // subsequent partial refund event (rare but allowed by some PSPs)
    // should keep targeting available/withdrawn — never bounce back to
    // pending.
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "REFUNDED",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 100,
      availableBalance: 50,
    });
    // 10% of 850 = 85; 50 from available, 35 from withdrawn
    expect(deltas.fromAvailable).toBe(50);
    expect(deltas.fromWithdrawn).toBe(35);
  });

  it("returns zero deltas when refund amount is zero", () => {
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "COMPLETED",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 0,
      availableBalance: 100,
    });
    expect(deltas).toEqual({ fromPending: 0, fromAvailable: 0, fromWithdrawn: 0 });
  });

  it("caps refund share at 100% even if PSP overshoots (defensive)", () => {
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "PAID",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 5000, // bogus — more than payment
      availableBalance: 0,
    });
    // capped at 100% → 850 from pending
    expect(deltas.fromPending).toBe(850);
  });

  it("treats negative availableBalance as zero (no double-credit)", () => {
    // If availableBalance somehow drifted negative from an earlier debt,
    // we should not "borrow back" from that negative figure — withdrawn
    // bears the full charge.
    const deltas = computeRefundBalanceDeltas({
      orderStatus: "COMPLETED",
      totalEarningsCents: 850,
      paymentAmountCents: 1000,
      refundAmountCents: 1000,
      availableBalance: -100,
    });
    expect(deltas.fromAvailable).toBe(0);
    expect(deltas.fromWithdrawn).toBe(850);
  });
});
