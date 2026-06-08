import Link from "next/link";
import { Star, ShieldCheck, Zap, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  priceCents: number;
  /** Optional pre-discount price; renders a strikethrough + discount chip when present. */
  originalPriceCents?: number | null;
  currency: string;
  rating: number;
  ratingCount: number;
  stockQuantity: number;
  status: string;
  isVerified: boolean;
  productType: string;
  deliveryType: string;
  category: { name: string; slug: string };
  seller: { displayName: string; verificationStatus: string };
  images: { url: string; alt: string | null }[];
  /** Optional region label (e.g. "Global", "EU", "US"). */
  region?: string | null;
  /** Optional platform / source label (e.g. "ChatGPT", "Claude"). */
  platform?: string | null;
  /** Highlight as eligible for SMART discount. */
  smartEligible?: boolean;
}

export async function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0]?.url;
  const tc = await getTranslations("common");
  const tCard = await getTranslations("product_card");

  const hasDiscount =
    typeof product.originalPriceCents === "number" &&
    product.originalPriceCents > product.priceCents;
  const discountPct = hasDiscount
    ? Math.round((1 - product.priceCents / (product.originalPriceCents as number)) * 100)
    : 0;

  const inStock = product.stockQuantity > 0 || product.productType === "SERVICE";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_8px_28px_-12px_hsl(var(--primary)/0.55)]"
      data-testid="product-card"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-secondary via-card to-background">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.images[0]?.alt ?? product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {product.category.name}
          </div>
        )}

        {/* Bottom legibility gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Top-left chips */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && <span className="discount-badge">-{discountPct}%</span>}
          {product.smartEligible && <span className="smart-chip">SMART</span>}
        </div>

        {/* Top-right region/platform */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {product.region && (
            <span className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
              {product.region}
            </span>
          )}
          {product.platform && (
            <span className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white/95 backdrop-blur">
              {product.platform}
            </span>
          )}
        </div>

        {/* Bottom delivery chip */}
        <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-1">
          {product.deliveryType === "INSTANT" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              <Zap className="h-3 w-3 text-primary" />
              {tCard("instant")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              <Clock className="h-3 w-3 text-amber-300" />
              {tCard("manual")}
            </span>
          )}
          {product.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-primary backdrop-blur">
              <ShieldCheck className="h-3 w-3" />
              {tc("verified")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-3">
        <div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {product.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 font-semibold">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {product.rating > 0 ? product.rating.toFixed(1) : "—"}
            </span>
            <span>·</span>
            <span>
              {product.ratingCount} {tCard("reviews_short")}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <Badge
              variant={inStock ? "outline" : "destructive"}
              className="mb-1 px-1.5 py-0 text-[10px]"
            >
              {inStock ? tCard("in_stock") : tCard("out_of_stock")}
            </Badge>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tCard("from")}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="price-tag-accent text-xl">
                {formatPrice(product.priceCents, product.currency)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.originalPriceCents as number, product.currency)}
                </span>
              )}
            </div>
          </div>
          <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-primary-foreground transition group-hover:bg-primary/90">
            {tCard("buy")}
          </span>
        </div>
      </div>
    </Link>
  );
}
