import type { DigitalInventoryItem } from "@prisma/client";

/**
 * Pure logic for assigning a digital code from a list of inventory items.
 * Used both by the live order fulfillment path and by unit tests.
 */
export function pickNextAvailableCode<T extends Pick<DigitalInventoryItem, "id" | "status" | "code">>(
  items: T[],
): T | null {
  return items.find((i) => i.status === "AVAILABLE") ?? null;
}

/**
 * Mask a code for display (e.g. NM-ABCD-1234 -> NM-****-1234).
 * Never expose unused codes to buyers; only the assigned code is shown.
 */
export function maskCode(code: string) {
  if (code.length <= 4) return "****";
  return code.slice(0, 2) + "****" + code.slice(-4);
}
