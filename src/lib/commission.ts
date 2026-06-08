/**
 * Pricing & commission math used by checkout, seller earnings, and tests.
 * All amounts are in integer cents to avoid floating-point drift.
 */

export interface FeeConfig {
  platformFeePercent: number; // e.g. 10 means 10%
  processingFeePercent: number; // e.g. 2.9 means 2.9%
  processingFeeFixedCents: number; // e.g. 30 cents
}

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 10),
  processingFeePercent: Number(process.env.PROCESSING_FEE_PERCENT ?? 2.9),
  processingFeeFixedCents: Number(process.env.PROCESSING_FEE_FIXED_CENTS ?? 30),
};

export interface PriceBreakdown {
  subtotalCents: number;
  platformFeeCents: number;
  processingFeeCents: number;
  sellerEarningsCents: number;
  totalCents: number;
}

export interface CartLine {
  priceCents: number;
  quantity: number;
}

/**
 * Calculate order totals.
 *
 * Total charged to buyer == subtotal (the PSP, currently YooKassa, deducts
 * processing fees from the merchant payout in real life). We track the
 * processing fee separately so seller earnings reflect a realistic payout.
 */
export function calculateOrderTotals(
  lines: CartLine[],
  fees: FeeConfig = DEFAULT_FEE_CONFIG,
): PriceBreakdown {
  if (lines.length === 0) {
    return {
      subtotalCents: 0,
      platformFeeCents: 0,
      processingFeeCents: 0,
      sellerEarningsCents: 0,
      totalCents: 0,
    };
  }

  const subtotalCents = lines.reduce((acc, l) => {
    if (l.priceCents < 0) throw new Error("priceCents must be non-negative");
    if (l.quantity <= 0) throw new Error("quantity must be positive");
    return acc + l.priceCents * l.quantity;
  }, 0);

  const platformFeeCents = Math.round((subtotalCents * fees.platformFeePercent) / 100);
  const processingFeeCents =
    Math.round((subtotalCents * fees.processingFeePercent) / 100) + fees.processingFeeFixedCents;
  const sellerEarningsCents = Math.max(0, subtotalCents - platformFeeCents - processingFeeCents);
  const totalCents = subtotalCents;

  return {
    subtotalCents,
    platformFeeCents,
    processingFeeCents,
    sellerEarningsCents,
    totalCents,
  };
}

/**
 * Seller payout calculator. Given pending earnings (cents) and an admin
 * adjustment in cents (e.g. for refunds), returns the available amount.
 */
export function calculateSellerPayout(pendingCents: number, adjustmentCents = 0) {
  if (pendingCents < 0) throw new Error("pendingCents must be non-negative");
  return Math.max(0, pendingCents + adjustmentCents);
}
