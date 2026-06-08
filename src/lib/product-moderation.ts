// §5.9 — pure helpers used by the seller product PATCH route. Lives in
// src/lib (not in the route file) so vitest can import them without
// pulling NextAuth / Next runtime modules into the test environment.

export const MODERATION_FIELDS = [
  "title",
  "description",
  "shortDescription",
  "priceCents",
  "productType",
  "digitalFileUrl",
  "externalUrl",
] as const;

/**
 * Decide whether a seller's PATCH must drop the product back to
 * PENDING_REVIEW. Returns true when ANY of:
 *   - one of MODERATION_FIELDS actually changed value
 *   - the primary image URL changed
 *   - risk score rose AND the new score crosses the high-risk threshold
 *
 * Note: the caller decides whether the threshold is crossed (`isHighRiskNow`).
 * We don't repeat the threshold constant here so this stays decoupled from
 * the risk module.
 */
export function shouldReturnToReview(input: {
  existing: {
    title: string;
    description: string;
    shortDescription: string | null;
    priceCents: number;
    productType: string;
    digitalFileUrl: string | null;
    externalUrl: string | null;
    riskScore: number;
    primaryImageUrl: string | null;
  };
  patch: Partial<{
    title: string;
    description: string;
    shortDescription: string | null;
    priceCents: number;
    productType: string;
    digitalFileUrl: string | null;
    externalUrl: string | null;
    imageUrl: string | null;
  }>;
  newRiskScore: number;
  isHighRiskNow: boolean;
}): boolean {
  const moderationDirty = MODERATION_FIELDS.some((field) => {
    const next = (input.patch as Record<string, unknown>)[field];
    if (next === undefined) return false;
    return next !== (input.existing as unknown as Record<string, unknown>)[field];
  });
  const imageChanged =
    input.patch.imageUrl !== undefined && input.patch.imageUrl !== input.existing.primaryImageUrl;
  const riskRose = input.newRiskScore > input.existing.riskScore && input.isHighRiskNow;
  return moderationDirty || imageChanged || riskRose;
}
