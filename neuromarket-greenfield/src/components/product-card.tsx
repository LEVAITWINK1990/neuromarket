import Link from "next/link";
import { Clock3, Star } from "lucide-react";

import { discountPercent } from "@/lib/catalog-utils";
import { demoCategories } from "@/lib/demo-data";
import { formatMoney } from "@/lib/format";
import type { DemoProduct } from "@/lib/types";

type ProductCardProps = {
  product: DemoProduct;
  wished?: boolean;
  compared?: boolean;
  onWishlist?: () => void;
  onCompare?: () => void;
};

export function ProductCard({ product }: ProductCardProps) {
  const discount = discountPercent(product);
  const category = demoCategories.find((item) => item.id === product.categoryId);
  const regionTone =
    product.coverage.toLowerCase().includes("eu") || product.coverage.toLowerCase().includes("us")
      ? "bg-[#00a3ff] text-[#101318]"
      : "bg-[#00dd80] text-[#101318]";

  return (
    <article className="overflow-hidden rounded-[8px] border border-[#2a3441] bg-[#1f262e] transition hover:border-[#475569] hover:bg-[#262e38] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,.5)]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={product.media.hero}
            alt={product.title}
            className="h-full w-full object-cover transition duration-300 hover:scale-[1.05]"
          />
          <div className="absolute left-2 top-2 z-[2] flex flex-col gap-1">
            <div className="inline-flex items-center gap-1 rounded-[4px] bg-[rgba(16,19,24,0.75)] px-[6px] py-1 text-[11px] font-bold text-white">
              <span>{category?.label ?? "AI"}</span>
            </div>
            {product.smart ? (
              <span className="inline-flex rounded-[4px] bg-[#e23636] px-[6px] py-1 text-[11px] font-bold text-white">
                -{discount}%
              </span>
            ) : null}
          </div>
          <span
            className={`absolute right-2 top-2 z-[2] rounded-[4px] px-[7px] py-[5px] text-[11px] font-bold uppercase leading-3 ${regionTone}`}
          >
            {product.coverage}
          </span>
        </div>

        <div className="flex h-[176px] flex-col justify-between px-4 pb-4 pt-3">
          <div>
            <div className="line-clamp-2 text-[14px] font-semibold leading-5 text-white">
              {product.title}
            </div>
            <div className="mt-2 flex items-center gap-[6px] text-[11px] text-[#94a3b8]">
              <span>Digital {product.productType === "SERVICE" ? "Service" : "Key"}</span>
              <span className="inline-flex items-center gap-1 text-[#00dd80]">
                <Clock3 className="h-3 w-3" />
                {product.deliveryType === "INSTANT" ? "Instant" : product.deliveryType}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[12px] leading-4 text-[#64748b] line-through">
                {formatMoney(product.originalPrice)}
              </div>
              <span className="mt-0.5 block text-[11px] text-[#94a3b8]">from</span>
              <div className="text-[20px] font-bold leading-6 text-[#00dd80]">
                {formatMoney(product.price)}
              </div>
            </div>

            <div className="grid justify-items-end gap-2">
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#94a3b8]">
                <Star className="h-3 w-3 fill-current text-[#ff7a00]" />
                {product.rating.toFixed(1)}
              </div>
              <span className="inline-flex h-10 items-center rounded-[6px] bg-[#ff7a00] px-4 text-[12px] font-bold uppercase tracking-[0.02em] text-white transition hover:bg-[#e66e00]">
                Buy now
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
