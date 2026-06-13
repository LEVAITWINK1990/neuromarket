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
  const { allProducts } = useDemoStore();
  const filtered = filterProducts(allProducts, { q, category, delivery, sort });
  const activeSort = sort ?? "popular";

  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
            Marketplace
          </p>
          <h1 className="mt-3 text-[34px] font-bold leading-tight text-white">
            AI subscriptions, vouchers, credits, files and services
          </h1>
          <p className="mt-3 max-w-4xl text-[14px] leading-6 text-[#94a3b8]">
            Search by product name, filter by delivery type and category, and compare fast-moving
            marketplace listings in a dense commercial grid.
          </p>
        </section>

        <section className="space-y-4 rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-5">
          <div>
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
              Categories
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/marketplace"
                className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${
                  !category ? "border-[#ff7a00] text-[#ff7a00]" : "border-[#2a3441] text-[#94a3b8]"
                }`}
              >
                All
              </Link>
              {demoCategories.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace?category=${item.id}${sort ? `&sort=${sort}` : ""}`}
                  className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${
                    category === item.id
                      ? "border-[#ff7a00] text-[#ff7a00]"
                      : "border-[#2a3441] text-[#94a3b8]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
                Sort
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["popular", "Popular"],
                  ["newest", "Newest"],
                  ["rating", "Rating"],
                  ["price-asc", "Price asc"],
                  ["price-desc", "Price desc"],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={`/marketplace?sort=${value}${category ? `&category=${category}` : ""}${delivery ? `&delivery=${delivery}` : ""}`}
                    className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                      activeSort === value
                        ? "bg-[#ff7a00] text-white"
                        : "bg-[#262e38] text-[#94a3b8]"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
                Delivery
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/marketplace${category ? `?category=${category}` : ""}`}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                    !delivery ? "bg-[#ff7a00] text-white" : "bg-[#262e38] text-[#94a3b8]"
                  }`}
                >
                  All
                </Link>
                {[
                  ["INSTANT", "Instant"],
                  ["MANUAL", "Manual"],
                  ["EXTERNAL_LINK", "External link"],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={`/marketplace?delivery=${value}${category ? `&category=${category}` : ""}${sort ? `&sort=${sort}` : ""}`}
                    className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                      delivery === value ? "bg-[#ff7a00] text-white" : "bg-[#262e38] text-[#94a3b8]"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#2a3441] bg-[#1f262e] px-5 py-4">
            <span className="text-[13px] text-[#94a3b8]">{filtered.length} products found</span>
            <div className="flex flex-wrap gap-2 text-[12px]">
              {q ? (
                <span className="rounded-full bg-[#262e38] px-3 py-2 text-[#94a3b8]">q: {q}</span>
              ) : null}
              {category ? (
                <span className="rounded-full bg-[#262e38] px-3 py-2 text-[#94a3b8]">
                  category: {category}
                </span>
              ) : null}
              {delivery ? (
                <span className="rounded-full bg-[#262e38] px-3 py-2 text-[#94a3b8]">
                  delivery: {delivery}
                </span>
              ) : null}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#2a3441] bg-[#1f262e] p-10 text-center text-[14px] text-[#94a3b8]">
              No products matched these filters. Reset part of the query and try again.
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
