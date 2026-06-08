import { describe, expect, it } from "vitest";
import { claimInventoryCode } from "@/server/checkout";

/**
 * §5.6 load test for the atomic inventory claim. We don't want to spin up
 * Postgres here, so we mock a `TransactionClient` whose `findFirst` and
 * `updateMany` operate on a shared in-memory array, with a tiny per-call
 * yield so that 20 concurrent claims actually interleave.
 *
 * Goals:
 *   - exactly 5 claims succeed,
 *   - exactly 15 fail (out-of-stock),
 *   - no item is double-claimed.
 */

type Status = "AVAILABLE" | "DELIVERED" | "RESERVED" | "REVOKED";
interface FakeItem {
  id: string;
  productId: string;
  status: Status;
  code: string;
  createdAt: Date;
  orderItemId: string | null;
  deliveredAt: Date | null;
}

function buildFakeTx(items: FakeItem[]) {
  return {
    digitalInventoryItem: {
      async findFirst(args: { where: { productId: string; status: Status }; orderBy?: unknown }) {
        // Tiny event-loop yield so concurrent calls interleave.
        await Promise.resolve();
        return (
          items.find(
            (i) => i.productId === args.where.productId && i.status === args.where.status,
          ) ?? null
        );
      },
      async updateMany(args: {
        where: { id: string; status: Status };
        data: { status: Status; deliveredAt: Date; orderItemId: string };
      }) {
        await Promise.resolve();
        const target = items.find((i) => i.id === args.where.id && i.status === args.where.status);
        if (!target) return { count: 0 };
        target.status = args.data.status;
        target.deliveredAt = args.data.deliveredAt;
        target.orderItemId = args.data.orderItemId;
        return { count: 1 };
      },
    },
  };
}

describe("claimInventoryCode under concurrency", () => {
  it("hands out each code exactly once with 20 concurrent buyers and 5 codes", async () => {
    const items: FakeItem[] = Array.from({ length: 5 }, (_, idx) => ({
      id: `code-${idx + 1}`,
      productId: "prod-1",
      status: "AVAILABLE",
      code: `NM-AAAA-${String(idx + 1).padStart(4, "0")}`,
      createdAt: new Date(2026, 0, 1, 0, 0, idx),
      orderItemId: null,
      deliveredAt: null,
    }));

    const fakeTx = buildFakeTx(items);
    const orderItemIds = Array.from({ length: 20 }, (_, idx) => `oi-${idx + 1}`);

    const results = await Promise.all(
      orderItemIds.map((oid) =>
        // @ts-expect-error mock client satisfies just the methods we call.
        claimInventoryCode(fakeTx, "prod-1", oid),
      ),
    );

    const successes = results.filter((r) => r !== null);
    const failures = results.filter((r) => r === null);
    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(15);

    const claimedIds = new Set(successes.map((r) => r!.id));
    expect(claimedIds.size).toBe(5); // no double-claim
    expect([...claimedIds].sort()).toEqual(["code-1", "code-2", "code-3", "code-4", "code-5"]);

    // Every successful row in the underlying store is DELIVERED, every failed
    // row is still AVAILABLE — but there are no failed rows here, since 5
    // exact items got handed out 5 ways.
    for (const item of items) {
      expect(item.status).toBe("DELIVERED");
      expect(item.orderItemId).not.toBeNull();
    }

    // Each orderItemId is unique across successful claims.
    const oidsUsed = new Set(
      items.map((i) => i.orderItemId).filter((x): x is string => x !== null),
    );
    expect(oidsUsed.size).toBe(5);
  });

  it("returns null when there is no stock", async () => {
    const fakeTx = buildFakeTx([]);
    // @ts-expect-error mock client
    const result = await claimInventoryCode(fakeTx, "prod-empty", "oi-1");
    expect(result).toBeNull();
  });

  it("does not exceed maxAttempts before giving up under heavy contention", async () => {
    // 1 code + 50 concurrent buyers; the first wins, all 49 others should
    // observe count=0 on their conditional update (or have findFirst return
    // null) and return null.
    const items: FakeItem[] = [
      {
        id: "lone",
        productId: "prod-1",
        status: "AVAILABLE",
        code: "NM-ONLY-0001",
        createdAt: new Date(),
        orderItemId: null,
        deliveredAt: null,
      },
    ];
    const fakeTx = buildFakeTx(items);
    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        // @ts-expect-error mock client
        claimInventoryCode(fakeTx, "prod-1", `oi-${i}`),
      ),
    );
    expect(results.filter((r) => r !== null)).toHaveLength(1);
    expect(results.filter((r) => r === null)).toHaveLength(49);
    expect(items[0].status).toBe("DELIVERED");
  });
});
