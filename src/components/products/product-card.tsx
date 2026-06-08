"use client";

import type { MockProduct } from "@/lib/mock-products";
import { Tag } from "lucide-react";

interface ProductCardProps {
  product: MockProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <a
      href={`/products/${product.id}`}
      className="gamivo-card flex items-center gap-3 p-2.5 cursor-pointer group"
    >
      {/* Image */}
      <div className="h-[72px] w-[72px] flex-shrink-0 rounded-md overflow-hidden bg-[#1a1a2e]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-medium text-[#e0e0e0] leading-tight line-clamp-2 group-hover:text-white transition-colors">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[11px] text-[#777] flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {product.platform}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <div className="text-[15px] font-bold text-white">
          ${product.price.toFixed(2)}
        </div>
        {product.originalPrice && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[11px] text-[#666] line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-[hsl(145,100%,39%)]">
              -{discount}%
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
