import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validation";
import { computeRiskScore, isHighRisk } from "@/lib/risk";
import { slugify } from "@/lib/utils";
import { requireApiSellerSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { encryptString } from "@/lib/crypto";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // §6.7 — publishing a product is a critical action; require verified email.
    const session = await requireApiSellerSession({ requireVerifiedEmail: true });
    // §6.4 — 20 product creates per (IP+sellerId) per day.
    await requireRateLimit(rl.productCreate, rateLimitKey(req, session.user.id));
    const raw = await req.json().catch(() => null);
    const parsed = productInputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid product");
    }
    const { codes, imageUrl, ...rest } = parsed.data;
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: session.user.sellerProfileId! },
    });
    if (!seller) throw new ApiError(404, "Seller not found");

    const risk = computeRiskScore({
      title: rest.title,
      description: rest.description,
      priceCents: rest.priceCents,
      productType: rest.productType,
      deliveryType: rest.deliveryType,
      isSellerVerified: seller.verificationStatus === "APPROVED",
    });

    const baseSlug = slugify(rest.title);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const isVerifiedSeller = seller.verificationStatus === "APPROVED";
    // Auto-publish if seller is verified AND risk is below threshold
    const status = isVerifiedSeller && !isHighRisk(risk) ? "PUBLISHED" : "PENDING_REVIEW";

    const created = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: rest.categoryId,
        title: rest.title,
        slug,
        shortDescription: rest.shortDescription,
        description: rest.description,
        productType: rest.productType,
        deliveryType: rest.deliveryType,
        priceCents: rest.priceCents,
        currency: rest.currency,
        stockQuantity: rest.stockQuantity,
        validityPeriod: rest.validityPeriod,
        refundPolicy: rest.refundPolicy,
        termsOfUse: rest.termsOfUse,
        externalUrl: rest.externalUrl,
        digitalFileUrl: rest.digitalFileUrl,
        manualDeliveryWindowHours: rest.manualDeliveryWindowHours ?? 48,
        riskScore: risk,
        isVerified: isVerifiedSeller,
        isModerated: status === "PUBLISHED",
        status,
        images: imageUrl ? { create: [{ url: imageUrl, position: 0 }] } : undefined,
        // §6.2 — codes encrypted at rest. We never store the plaintext.
        inventoryItems:
          codes && codes.length
            ? { create: codes.map((c) => ({ code: encryptString(c) })) }
            : undefined,
      },
    });
    return NextResponse.json({ ok: true, id: created.id, status });
  } catch (err) {
    return toApiResponse(err);
  }
}
