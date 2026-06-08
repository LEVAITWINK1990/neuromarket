import { z } from "zod";

export const productInputSchema = z.object({
  title: z.string().min(3).max(120),
  shortDescription: z.string().min(10).max(280),
  description: z.string().min(20).max(8000),
  categoryId: z.string().min(1),
  productType: z.enum([
    "LICENSE_KEY",
    "VOUCHER_CODE",
    "DIGITAL_FILE",
    "MANUAL_DELIVERY",
    "SERVICE",
    "AFFILIATE_OFFER",
  ]),
  deliveryType: z.enum(["INSTANT", "MANUAL", "EXTERNAL_LINK"]),
  priceCents: z.number().int().min(0).max(10_000_000),
  currency: z.string().length(3).default("RUB"),
  stockQuantity: z.number().int().min(0).max(1_000_000).default(0),
  validityPeriod: z.string().max(120).optional().nullable(),
  termsOfUse: z.string().max(4000).optional().nullable(),
  refundPolicy: z.string().max(2000).optional().nullable(),
  externalUrl: z.string().url().max(2000).optional().nullable(),
  digitalFileUrl: z.string().url().max(2000).optional().nullable(),
  manualDeliveryWindowHours: z.number().int().min(1).max(720).default(48),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  codes: z.array(z.string().min(1).max(400)).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const signUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const reviewSchema = z.object({
  orderId: z.string().min(1),
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(5).max(2000),
});

export const disputeSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3).max(200),
  description: z.string().min(10).max(4000),
});

export const reportSchema = z.object({
  productId: z.string().min(1),
  reason: z.enum([
    "UNAUTHORIZED_RESALE",
    "STOLEN_ACCOUNT",
    "FAKE_PRODUCT",
    "MISLEADING_DESCRIPTION",
    "ILLEGAL_CONTENT",
    "DUPLICATE_LISTING",
    "OTHER",
  ]),
  description: z.string().max(2000).optional(),
});

export const sellerVerificationSchema = z.object({
  fullName: z.string().min(2).max(120),
  country: z.string().min(2).max(80),
  contactEmail: z.string().email(),
  websiteUrl: z.string().url().optional().or(z.literal("")).nullable(),
  productsDescription: z.string().min(20).max(4000),
  authorizationNotes: z.string().min(10).max(4000),
  acceptedRules: z.literal(true, {
    errorMap: () => ({ message: "You must accept the marketplace rules" }),
  }),
});

const SENSITIVE_PATTERNS = [
  /api[_\s-]?key/i,
  /password\s*[:=]/i,
  /bearer\s+[a-z0-9-_.]+/i,
  /sk-[a-z0-9]{16,}/i,
  /-----BEGIN/i,
];

export function containsSensitive(body: string) {
  return SENSITIVE_PATTERNS.some((re) => re.test(body));
}
