"use client";

import { ProductCard } from "./product-card";
import type { MockProduct } from "@/lib/mock-products";

interface ProductGridProps {
  products: MockProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[15px] text-[#888]">No products found</p>
        <p className="mt-1 text-[13px] text-[#555]">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
