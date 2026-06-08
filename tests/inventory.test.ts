import { describe, expect, it } from "vitest";
import { pickNextAvailableCode, maskCode } from "@/lib/inventory";

const item = (id: string, status: "AVAILABLE" | "RESERVED" | "DELIVERED" | "REVOKED", code = "NM-AAAA-0001") => ({
  id,
  status,
  code,
});

describe("pickNextAvailableCode", () => {
  it("returns null when no items", () => {
    expect(pickNextAvailableCode([])).toBeNull();
  });

  it("returns the first AVAILABLE item", () => {
    const items = [
      item("1", "DELIVERED"),
      item("2", "AVAILABLE", "NM-FREE-AAAA"),
      item("3", "AVAILABLE", "NM-FREE-BBBB"),
    ];
    expect(pickNextAvailableCode(items)?.id).toBe("2");
  });

  it("returns null when all items consumed", () => {
    const items = [item("1", "DELIVERED"), item("2", "REVOKED"), item("3", "RESERVED")];
    expect(pickNextAvailableCode(items)).toBeNull();
  });
});

describe("maskCode", () => {
  it("returns asterisks for very short codes", () => {
    expect(maskCode("ab")).toBe("****");
  });

  it("keeps a short prefix and suffix for normal codes", () => {
    const masked = maskCode("NM-ABCD-1234");
    expect(masked.startsWith("NM")).toBe(true);
    expect(masked.endsWith("1234")).toBe(true);
    expect(masked).toContain("****");
  });
});
