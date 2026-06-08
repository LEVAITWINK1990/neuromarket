import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { encryptString } from "@/lib/crypto";
import { logger } from "@/lib/logger";

// Admin product create — bypasses seller verification and risk-score gating.
// Admin uses their own auto-provisioned SellerProfile (verificationStatus =
// APPROVED) so existing seller-tied invariants (orders, payouts, balances)
// keep working unchanged.

async function ensureAdminSellerProfile(userId: string, displayName: string) {
  const existing = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (existing) {
    if (existing.verificationStatus !== "APPROVED") {
      return prisma.sellerProfile.update({
        where: { id: existing.id },
        data: { verificationStatus: "APPROVED", verifiedAt: new Date() },
      });
    }
    return existing;
  }
  return prisma.sellerProfile.create({
    data: {
      userId,
      displayName,
      verificationStatus: "APPROVED",
      verifiedAt: new Date(),
    },
  });
}

export async function POST(req: Request) {
  try {
    const session = await requireApiRole("ADMIN");
    const raw = await req.json().catch(() => null);
    const parsed = productInputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid product");
    }
    const { codes, imageUrl, ...rest } = parsed.data;
    const seller = await ensureAdminSellerProfile(
      session.user.id,
      session.user.name ?? session.user.email ?? "Admin",
    );

    const baseSlug = slugify(rest.title);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

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
        riskScore: 0,
        isVerified: true,
        isModerated: true,
        status: "PUBLISHED",
        images: imageUrl ? { create: [{ url: imageUrl, position: 0 }] } : undefined,
        inventoryItems:
          codes && codes.length
            ? { create: codes.map((c) => ({ code: encryptString(c) })) }
            : undefined,
      },
    });
    logger.info(
      { where: "admin.products.create", productId: created.id, adminId: session.user.id },
      "admin published product",
    );
    return NextResponse.json({ ok: true, id: created.id, status: "PUBLISHED" });
  } catch (err) {
    return toApiResponse(err);
  }
}
