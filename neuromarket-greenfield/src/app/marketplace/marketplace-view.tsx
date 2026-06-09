"use client";

import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { filterProducts } from "@/lib/catalog-utils";
import { demoCategories } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";

export function MarketplaceView({
  category,
  delivery,
  q,
  sort,
}: {
  category?: string;
  delivery?: string;
  q?: string;
  sort?: string;
}) {
  const { allProducts, compare, toggleCompare, toggleWishlist, wishlist } = useDemoStore();
  const query = (q ?? "").toLowerCase();
  const filtered = filterProducts(allProducts, { q, category, delivery, sort });

  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
            Marketplace
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">Каталог цифровых AI-товаров</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/60">
            Фильтруй витрину по категориям, цене, delivery type и сценариям: licenses, vouchers,
            files, services.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {demoCategories.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace?category=${item.id}`}
                className={`rounded-full border px-4 py-2 text-sm ${
                  category === item.id
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-white/10 text-white/65"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.28fr_0.72fr]">
          <aside className="space-y-4 rounded-[28px] border border-white/10 bg-[#11161f] p-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
                Sort
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  ["popular", "Popular"],
                  ["newest", "Newest"],
                  ["rating", "Rating"],
                  ["price-asc", "Price asc"],
                  ["price-desc", "Price desc"],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={`/marketplace?sort=${value}${category ? `&category=${category}` : ""}`}
                    className={`rounded-full px-4 py-2 text-sm ${
                      (sort ?? "popular") === value
                        ? "bg-[#f97316] text-black"
                        : "bg-[#0d131c] text-white/70"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
                Delivery
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  ["INSTANT", "Instant"],
                  ["MANUAL", "Manual"],
                  ["EXTERNAL_LINK", "External link"],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={`/marketplace?delivery=${value}${category ? `&category=${category}` : ""}`}
                    className={`rounded-full px-4 py-2 text-sm ${
                      delivery === value ? "bg-[#f97316] text-black" : "bg-[#0d131c] text-white/70"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[28px] border border-white/10 bg-[#11161f] px-5 py-4">
              <span className="text-sm text-white/60">{filtered.length} товаров найдено</span>
              <div className="flex gap-2 text-xs text-white/45">
                {query ? (
                  <span className="rounded-full bg-white/5 px-3 py-2">q: {query}</span>
                ) : null}
                {category ? (
                  <span className="rounded-full bg-white/5 px-3 py-2">category: {category}</span>
                ) : null}
                {delivery ? (
                  <span className="rounded-full bg-white/5 px-3 py-2">delivery: {delivery}</span>
                ) : null}
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wished={wishlist.includes(product.id)}
                    compared={compare.includes(product.id)}
                    onWishlist={() => toggleWishlist(product.id)}
                    onCompare={() => toggleCompare(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-[#11161f] p-10 text-center text-white/55">
                По текущим фильтрам товаров нет. Сбрось часть условий и попробуй снова.
              </div>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
