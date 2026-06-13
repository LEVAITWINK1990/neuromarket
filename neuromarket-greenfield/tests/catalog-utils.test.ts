import { describe, expect, it, vi } from "vitest";

import { demoProducts } from "@/lib/demo-data";
import { buildDeliveredAsset, discountPercent, filterProducts } from "@/lib/catalog-utils";

describe("catalog-utils", () => {
  it("filters products by query and category", () => {
    const results = filterProducts(demoProducts, {
      q: "workspace",
      category: "chatgpt",
      sort: "popular",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.slug).toBe("chatgpt-team-workspace-bundle");
  });

  it("sorts by ascending price", () => {
    const results = filterProducts(demoProducts, { sort: "price-asc" });
    expect(results[0]?.price).toBeLessThanOrEqual(results[1]?.price ?? Number.MAX_SAFE_INTEGER);
  });

  it("calculates discount percentage", () => {
    expect(discountPercent({ price: 30, originalPrice: 60 })).toBe(50);
  });

  it("builds instant delivery codes deterministically under mocked random", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);
    expect(buildDeliveredAsset(demoProducts[0])).toContain("NM-P-CHATGPT-TEAM");
    vi.restoreAllMocks();
  });
});
