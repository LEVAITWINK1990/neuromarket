import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validation";
import { computeRiskScore, isHighRisk } from "@/lib/risk";
import { requireApiSellerSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { encryptString } from "@/lib/crypto";
import { shouldReturnToReview } from "@/lib/product-moderation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // §6.7 — publishing changes to a live product is a critical action.
    const session = await requireApiSellerSession({ requireVerifiedEmail: true });
    const product = await prisma.product.findFirst({
      where: { id: params.id, sellerId: session.user.sellerProfileId! },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    });
    if (!product) throw new ApiError(404, "Not found");

    const parsed = productInputSchema.partial().safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid product");
    }
    const { codes, imageUrl, ...rest } = parsed.data;
    const merged = { ...product, ...rest };
    const risk = computeRiskScore({
      title: merged.title,
      description: merged.description,
      priceCents: merged.priceCents,
      productType: merged.productType,
      deliveryType: merged.deliveryType,
      isSellerVerified: product.isVerified,
    });

    const requiresReview = shouldReturnToReview({
      existing: {
        title: product.title,
        description: product.description,
        shortDescription: product.shortDescription,
        priceCents: product.priceCents,
        productType: product.productType,
        digitalFileUrl: product.digitalFileUrl,
        externalUrl: product.externalUrl,
        riskScore: product.riskScore,
        primaryImageUrl: product.images[0]?.url ?? null,
      },
      patch: { ...rest, imageUrl },
      newRiskScore: risk,
      isHighRiskNow: isHighRisk(risk),
    });

    // Drop title/slug regen — we don't reslug on edit (would break inbound links).
    const data: Prisma.ProductUpdateInput = {
      title: rest.title,
      shortDescription: rest.shortDescription,
      description: rest.description,
      category: rest.categoryId ? { connect: { id: rest.categoryId } } : undefined,
      productType: rest.productType,
      deliveryType: rest.deliveryType,
      priceCents: rest.priceCents,
      stockQuantity: rest.stockQuantity,
      validityPeriod: rest.validityPeriod,
      refundPolicy: rest.refundPolicy,
      termsOfUse: rest.termsOfUse,
      externalUrl: rest.externalUrl,
      digitalFileUrl: rest.digitalFileUrl,
      manualDeliveryWindowHours: rest.manualDeliveryWindowHours,
      riskScore: risk,
      images: imageUrl
        ? {
            deleteMany: {},
            create: [{ url: imageUrl, position: 0 }],
          }
        : undefined,
      // §6.2 — codes encrypted at rest.
      inventoryItems: codes
        ? { create: codes.map((c) => ({ code: encryptString(c) })) }
        : undefined,
    };

    if (requiresReview && product.status !== "DRAFT") {
      data.status = "PENDING_REVIEW";
      data.isModerated = false;
    }

    const updated = await prisma.product.update({ where: { id: product.id }, data });
    return NextResponse.json({
      ok: true,
      id: updated.id,
      status: updated.status,
      requiresReview,
    });
  } catch (err) {
    return toApiResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiSellerSession();
    await prisma.product.updateMany({
      where: { id: params.id, sellerId: session.user.sellerProfileId! },
      data: { status: "DRAFT" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
