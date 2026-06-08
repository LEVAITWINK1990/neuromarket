import { describe, expect, it } from "vitest";
import {
  productInputSchema,
  signUpSchema,
  reviewSchema,
  disputeSchema,
  reportSchema,
  sellerVerificationSchema,
  containsSensitive,
} from "@/lib/validation";

describe("productInputSchema", () => {
  const valid = {
    title: "Official AI Writer Voucher",
    shortDescription: "Official voucher for the AI Writer SaaS, 1 month.",
    description:
      "Receive an official voucher code to redeem on the AI Writer platform for one month of Pro access.",
    categoryId: "cat_1",
    productType: "VOUCHER_CODE" as const,
    deliveryType: "INSTANT" as const,
    priceCents: 2999,
    currency: "USD",
    stockQuantity: 10,
  };

  it("accepts a valid product", () => {
    expect(productInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects very short titles", () => {
    const r = productInputSchema.safeParse({ ...valid, title: "x" });
    expect(r.success).toBe(false);
  });

  it("rejects negative prices", () => {
    const r = productInputSchema.safeParse({ ...valid, priceCents: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects invalid product types", () => {
    const r = productInputSchema.safeParse({ ...valid, productType: "ILLEGAL" });
    expect(r.success).toBe(false);
  });

  it("optionally accepts a list of codes", () => {
    const r = productInputSchema.safeParse({ ...valid, codes: ["NM-1", "NM-2"] });
    expect(r.success).toBe(true);
  });
});

describe("signUpSchema", () => {
  it("requires a strong-enough password", () => {
    const r = signUpSchema.safeParse({
      name: "John",
      email: "j@example.com",
      password: "short",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a valid signup", () => {
    const r = signUpSchema.safeParse({
      name: "John",
      email: "j@example.com",
      password: "longenoughpassword",
      role: "BUYER",
    });
    expect(r.success).toBe(true);
  });
});

describe("reviewSchema", () => {
  it("requires rating between 1 and 5", () => {
    expect(
      reviewSchema.safeParse({
        orderId: "o",
        productId: "p",
        rating: 0,
        text: "hello world",
      }).success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({
        orderId: "o",
        productId: "p",
        rating: 6,
        text: "hello world",
      }).success,
    ).toBe(false);
  });
});

describe("disputeSchema", () => {
  it("requires a description", () => {
    expect(
      disputeSchema.safeParse({ orderId: "o", reason: "bad", description: "" }).success,
    ).toBe(false);
  });
});

describe("reportSchema", () => {
  it("accepts a valid report reason", () => {
    expect(
      reportSchema.safeParse({ productId: "p", reason: "UNAUTHORIZED_RESALE" }).success,
    ).toBe(true);
  });

  it("rejects unknown reasons", () => {
    expect(
      reportSchema.safeParse({ productId: "p", reason: "MADE_UP" }).success,
    ).toBe(false);
  });
});

describe("sellerVerificationSchema", () => {
  it("requires acceptance of marketplace rules", () => {
    const base = {
      fullName: "Acme Co",
      country: "DE",
      contactEmail: "ops@acme.test",
      productsDescription:
        "We sell official vouchers for our own AI writing assistant product line.",
      authorizationNotes:
        "We are the makers of the product and have full rights to resell vouchers.",
    };
    expect(
      sellerVerificationSchema.safeParse({ ...base, acceptedRules: false }).success,
    ).toBe(false);
    expect(
      sellerVerificationSchema.safeParse({ ...base, acceptedRules: true }).success,
    ).toBe(true);
  });
});

describe("containsSensitive", () => {
  it("detects API key patterns", () => {
    expect(containsSensitive("here is my api_key: sk-abc123abc123abc123")).toBe(true);
  });

  it("detects passwords", () => {
    expect(containsSensitive("password: hunter2")).toBe(true);
  });

  it("detects PEM-style secrets", () => {
    expect(containsSensitive("-----BEGIN PRIVATE KEY-----")).toBe(true);
  });

  it("returns false for benign messages", () => {
    expect(containsSensitive("hello, is this still available?")).toBe(false);
  });
});
