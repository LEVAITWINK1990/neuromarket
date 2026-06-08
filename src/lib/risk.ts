/**
 * Lightweight risk scoring for listings. Higher score == more risk.
 * Listings above the high-risk threshold require admin approval.
 */
export interface RiskInput {
  title: string;
  description: string;
  priceCents: number;
  productType: string;
  deliveryType: string;
  isSellerVerified: boolean;
  reportCount?: number;
}

export const HIGH_RISK_THRESHOLD = 50;

const SUSPICIOUS_KEYWORDS = [
  "cracked",
  "stolen",
  "leaked",
  "shared account",
  "account login",
  "warez",
  "keygen",
  "nulled",
  "free premium",
  "telegram only",
  "no warranty",
  "burner",
];

export function computeRiskScore(input: RiskInput) {
  let score = 0;
  const text = `${input.title} ${input.description}`.toLowerCase();

  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (text.includes(kw)) score += 25;
  }

  if (!input.isSellerVerified) score += 10;
  if (input.priceCents > 0 && input.priceCents < 100) score += 15; // unrealistic price
  if (input.reportCount && input.reportCount > 0)
    score += Math.min(40, input.reportCount * 10);

  // Manual delivery of sensitive items is higher risk
  if (
    input.deliveryType === "MANUAL" &&
    (input.productType === "LICENSE_KEY" || input.productType === "VOUCHER_CODE")
  ) {
    score += 15;
  }

  return Math.min(100, score);
}

export function isHighRisk(score: number) {
  return score >= HIGH_RISK_THRESHOLD;
}
