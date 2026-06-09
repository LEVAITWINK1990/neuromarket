import Link from "next/link";
import { BadgeCheck, Clock3, Heart, Scale, Star } from "lucide-react";

import { discountPercent } from "@/lib/catalog-utils";
import { formatMoney } from "@/lib/format";
import type { DemoProduct } from "@/lib/types";

export function ProductCard({
  product,
  onWishlist,
  onCompare,
  wished,
  compared,
}: {
  product: DemoProduct;
  wished?: boolean;
  compared?: boolean;
  onWishlist?: () => void;
  onCompare?: () => void;
}) {
  const discount = discountPercent(product);

  return (
    <article className="group overflow-hidden rounded-[18px] bg-[#252525]">
      <div
        className="relative aspect-[313/378] overflow-hidden p-4"
        style={{
          backgroundImage: `linear-gradient(145deg, ${product.cover.from}, ${product.cover.via}, ${product.cover.to})`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <span className="inline-flex rounded-[10px] bg-[#ef4444] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white">
              -{discount}%
            </span>
            {product.smart ? (
              <span className="block rounded-[10px] bg-black/25 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white">
                SMART
              </span>
            ) : null}
          </div>
          <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white">
            {product.cover.eyebrow}
          </span>
        </div>

        <div className="mt-8">
          <div className="text-[72px] font-black leading-none text-white/90">
            {product.cover.glyph}
          </div>
          <p className="mt-3 max-w-[12rem] text-[13px] font-bold leading-5 text-white/88">
            {product.shortDescription}
          </p>
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold text-white">
            <Clock3 className="h-3.5 w-3.5" />
            {product.deliveryType}
          </span>
          {product.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold text-white">
              <BadgeCheck className="h-3.5 w-3.5 text-[#f97316]" />
              Verified
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-[18px] font-black leading-6 text-white">
            {product.title}
          </h3>
          <div className="flex items-center gap-2 text-[12px] font-medium text-white/65">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-[#f97316]" />
              {product.rating.toFixed(1)}
            </span>
            <span>{product.ratingCount} reviews</span>
            <span>{product.salesCount} sold</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[12px] font-medium text-white/45 line-through">
              {formatMoney(product.originalPrice)}
            </div>
            <div className="text-[32px] font-black leading-none text-[#ff6a00]">
              {formatMoney(product.price)}
            </div>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="rounded-[10px] bg-[#ff6a00] px-4 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-white"
          >
            Buy now
          </Link>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onWishlist}
            className={`flex-1 rounded-[10px] border px-3 py-2 text-xs font-bold transition ${
              wished
                ? "border-[#ff6a00] text-[#ff6a00]"
                : "border-white/10 text-white/70 hover:text-white"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Heart className="h-3.5 w-3.5" />
              Wishlist
            </span>
          </button>
          <button
            type="button"
            onClick={onCompare}
            className={`flex-1 rounded-[10px] border px-3 py-2 text-xs font-bold transition ${
              compared
                ? "border-[#ff6a00] text-[#ff6a00]"
                : "border-white/10 text-white/70 hover:text-white"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Scale className="h-3.5 w-3.5" />
              Compare
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
