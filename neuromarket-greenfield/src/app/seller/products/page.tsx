"use client";

import Link from "next/link";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";

export default function SellerProductsPage() {
  const { allProducts, currentUser } = useDemoStore();
  const products = allProducts.filter((item) => item.sellerId === currentUser?.sellerId);

  return (
    <PageShell>
      <Guard title="Seller products" role="SELLER">
        <div className="space-y-6">
          <section className="flex items-center justify-between rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h1 className="text-4xl font-black text-white">Seller products</h1>
            <Link
              href="/seller/products/new"
              className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
            >
              New product
            </Link>
          </section>
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-[28px] border border-white/10 bg-[#11161f] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-black text-white">{product.title}</div>
                    <div className="mt-1 text-sm text-white/55">
                      {product.productType} · {product.deliveryType}
                    </div>
                  </div>
                  <div className="text-sm text-white/60">{product.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
