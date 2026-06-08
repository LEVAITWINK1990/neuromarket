import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Star,
  ShieldCheck,
  Zap,
  ExternalLink,
  FileText,
  Wrench,
  Mail,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { ProductActions } from "./product-actions";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

const PRODUCT_TYPE_ICONS: Record<string, React.ReactNode> = {
  LICENSE_KEY: <ShieldCheck className="h-3.5 w-3.5" />,
  VOUCHER_CODE: <Zap className="h-3.5 w-3.5" />,
  DIGITAL_FILE: <FileText className="h-3.5 w-3.5" />,
  MANUAL_DELIVERY: <Mail className="h-3.5 w-3.5" />,
  SERVICE: <Wrench className="h-3.5 w-3.5" />,
  AFFILIATE_OFFER: <ExternalLink className="h-3.5 w-3.5" />,
};

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      seller: { include: { user: { select: { name: true, image: true } } } },
      images: { orderBy: { position: "asc" } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          buyer: { select: { name: true, image: true } },
        },
      },
    },
  });
  if (!product || product.status !== "PUBLISHED") notFound();

  const [availableCount, similar, sellerOther] = await Promise.all([
    prisma.digitalInventoryItem.count({
      where: { productId: product.id, status: "AVAILABLE" },
    }),
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        categoryId: product.categoryId,
        NOT: { id: product.id },
      },
      take: 3,
      include: {
        category: true,
        seller: true,
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        sellerId: product.sellerId,
        NOT: { id: product.id },
      },
      take: 3,
      include: {
        category: true,
        seller: true,
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
  ]);

  const inStock =
    product.productType === "SERVICE" || product.productType === "AFFILIATE_OFFER"
      ? true
      : product.productType === "DIGITAL_FILE"
        ? !!product.digitalFileUrl
        : availableCount > 0 || product.stockQuantity > 0;

  const session = await auth();
  const t = await getTranslations("product");
  const tType = await getTranslations("product_type");
  const productIcon = PRODUCT_TYPE_ICONS[product.productType];
  const safeTType = (key: string, fallback: string) => {
    try {
      return tType(key);
    } catch {
      return fallback;
    }
  };
  const productTypeLabel = safeTType(
    product.productType,
    product.productType.toLowerCase().replace(/_/g, " "),
  );

  const receiveKeyMap: Record<string, string> = {
    LICENSE_KEY: "receive_license_key",
    VOUCHER_CODE: "receive_voucher_code",
    DIGITAL_FILE: "receive_digital_file",
    MANUAL_DELIVERY: "receive_manual_delivery",
    SERVICE: "receive_service",
    AFFILIATE_OFFER: "receive_affiliate_offer",
  };
  const receiveKey = receiveKeyMap[product.productType];

  return (
    <div className="container py-10">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/marketplace" className="hover:text-foreground">
          {t("breadcrumb_marketplace")}
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/marketplace?category=${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span className="mx-1">/</span>
        <span>{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div>
          <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-background aspect-video">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("no_image")}
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt ?? ""}
                  className="aspect-square cursor-pointer rounded-lg border border-border object-cover transition-colors hover:border-primary"
                />
              ))}
            </div>
          )}

          <article className="prose prose-sm dark:prose-invert mt-8 max-w-none">
            <h2 className="text-xl font-semibold">{t("about")}</h2>
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
            <h3 className="text-lg font-semibold">{t("what_you_receive")}</h3>
            <ul className="text-muted-foreground">
              {receiveKey && (
                <li>
                  {t(receiveKey, {
                    hours: product.manualDeliveryWindowHours,
                  })}
                </li>
              )}
              <li>{t("receive_order_details")}</li>
            </ul>

            {product.termsOfUse && (
              <>
                <h3>{t("terms_of_use")}</h3>
                <p className="text-muted-foreground whitespace-pre-line">{product.termsOfUse}</p>
              </>
            )}
            {product.refundPolicy && (
              <>
                <h3>{t("refund_policy")}</h3>
                <p className="text-muted-foreground whitespace-pre-line">{product.refundPolicy}</p>
              </>
            )}
            {product.validityPeriod && (
              <>
                <h3>{t("validity_period")}</h3>
                <p className="text-muted-foreground">{product.validityPeriod}</p>
              </>
            )}
          </article>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-3">{t("faq_title")}</h2>
            <div className="space-y-2">
              {[
                { q: t("faq_q1"), a: t("faq_a1") },
                { q: t("faq_q2"), a: t("faq_a2") },
                { q: t("faq_q3"), a: t("faq_a3") },
              ].map((f) => (
                <Card key={f.q}>
                  <CardContent className="p-4">
                    <p className="font-medium">{f.q}</p>
                    <p className="text-sm text-muted-foreground">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-3">{t("reviews_title")}</h2>
            <div className="space-y-3">
              {product.reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground text-center">
                    {t("reviews_empty")}
                  </CardContent>
                </Card>
              ) : (
                product.reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">
                            {r.buyer.name ?? t("reviews_anonymous")}
                          </div>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < r.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.text}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {productIcon}
                {productTypeLabel}
                <span>·</span>
                {product.deliveryType === "INSTANT" && t("delivery_instant")}
                {product.deliveryType === "MANUAL" &&
                  t("delivery_manual", { hours: product.manualDeliveryWindowHours })}
                {product.deliveryType === "EXTERNAL_LINK" && t("delivery_external")}
              </div>
              <h1 className="text-2xl font-semibold leading-tight">{product.title}</h1>
              <p className="text-muted-foreground text-sm">{product.shortDescription}</p>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}{" "}
                <span className="text-muted-foreground">
                  {t("reviews_count", { count: product.ratingCount })}
                </span>
              </div>
              <Separator />
              <div className="price-tag-accent text-3xl">
                {formatPrice(product.priceCents, product.currency)}
              </div>
              <ProductActions
                productId={product.id}
                slug={product.slug}
                isSignedIn={!!session?.user}
                inStock={inStock}
                isOwnSeller={session?.user.sellerProfileId === product.sellerId}
              />
              <div className="text-xs text-muted-foreground space-y-1">
                {product.isVerified && (
                  <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> {t("verified_seller")}
                  </div>
                )}
                {product.deliveryType === "MANUAL" && (
                  <div className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {t("funds_held")}
                  </div>
                )}
                {!product.isVerified && (
                  <div className="inline-flex items-center gap-1 text-amber-600">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {t("not_verified")}
                  </div>
                )}
              </div>
              <Separator />
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  {t("trust_instant")}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {t("trust_protection")}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  {t("trust_secure")}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                {t("sold_by")}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {product.seller.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{product.seller.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("seller_rating", {
                      rating: product.seller.rating.toFixed(1),
                      count: product.seller.ratingCount,
                    })}
                  </div>
                </div>
              </div>
              {product.seller.bio && (
                <p className="text-sm text-muted-foreground">{product.seller.bio}</p>
              )}
              {product.seller.country && (
                <div className="text-xs text-muted-foreground">
                  {t("seller_from", { country: product.seller.country })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                {t("category")}
              </div>
              <Badge variant="secondary">{product.category.name}</Badge>
              <div className="text-xs font-medium uppercase text-muted-foreground mt-3">
                {t("listed")}
              </div>
              <div className="text-sm text-muted-foreground">{formatDate(product.createdAt)}</div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {(similar.length > 0 || sellerOther.length > 0) && (
        <section className="mt-12 space-y-8">
          {similar.length > 0 && (
            <div>
              <h2 className="section-title mb-4 border-b border-border pb-3">{t("similar")}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {similar.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      shortDescription: p.shortDescription,
                      priceCents: p.priceCents,
                      currency: p.currency,
                      rating: p.rating,
                      ratingCount: p.ratingCount,
                      stockQuantity: p.stockQuantity,
                      status: p.status,
                      isVerified: p.isVerified,
                      productType: p.productType,
                      deliveryType: p.deliveryType,
                      category: p.category,
                      seller: p.seller,
                      images: p.images,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {sellerOther.length > 0 && (
            <div>
              <h2 className="section-title mb-4 border-b border-border pb-3">
                {t("from_same_seller", { name: product.seller.displayName })}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sellerOther.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      shortDescription: p.shortDescription,
                      priceCents: p.priceCents,
                      currency: p.currency,
                      rating: p.rating,
                      ratingCount: p.ratingCount,
                      stockQuantity: p.stockQuantity,
                      status: p.status,
                      isVerified: p.isVerified,
                      productType: p.productType,
                      deliveryType: p.deliveryType,
                      category: p.category,
                      seller: p.seller,
                      images: p.images,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
