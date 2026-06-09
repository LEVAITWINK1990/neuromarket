"use client";

import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { useDemoStore } from "@/lib/demo-store";

export default function WishlistPage() {
  const { allProducts, compare, toggleCompare, toggleWishlist, wishlist } = useDemoStore();
  const wished = allProducts.filter((product) => wishlist.includes(product.id));

  return (
    <PageShell>
      <div className="space-y-6">
        <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
          <h1 className="text-4xl font-black text-white">Wishlist</h1>
        </section>
        {wished.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {wished.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wished
                compared={compare.includes(product.id)}
                onWishlist={() => toggleWishlist(product.id)}
                onCompare={() => toggleCompare(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-[#11161f] p-10 text-center text-white/55">
            Wishlist пока пуст.
          </div>
        )}
      </div>
    </PageShell>
  );
}
