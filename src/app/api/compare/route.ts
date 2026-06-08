import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsRaw = url.searchParams.get("ids") ?? "";
  const ids = idsRaw.split(",").filter(Boolean).slice(0, 3);
  if (ids.length === 0) return NextResponse.json({ products: [] });
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    include: { seller: true },
  });
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      shortDescription: p.shortDescription,
      priceCents: p.priceCents,
      currency: p.currency,
      productType: p.productType,
      deliveryType: p.deliveryType,
      validityPeriod: p.validityPeriod,
      refundPolicy: p.refundPolicy,
      sellerName: p.seller.displayName,
      sellerRating: p.seller.rating,
      isVerifiedSeller: p.seller.verificationStatus === "APPROVED",
    })),
  });
}
