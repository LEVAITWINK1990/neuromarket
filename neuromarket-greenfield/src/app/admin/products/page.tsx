"use client";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";

export default function AdminProductsPage() {
  const { customProducts, updateProductStatus } = useDemoStore();

  return (
    <PageShell>
      <Guard title="Admin products" role="ADMIN">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h1 className="text-4xl font-black text-white">Admin products queue</h1>
          </section>
          <div className="space-y-4">
            {customProducts.length > 0 ? (
              customProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[28px] border border-white/10 bg-[#11161f] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-black text-white">{product.title}</div>
                      <div className="mt-1 text-sm text-white/55">{product.status}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateProductStatus(product.id, "PUBLISHED")}
                        className="rounded-full bg-[#f97316] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProductStatus(product.id, "SUSPENDED")}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-[#11161f] p-10 text-center text-white/55">
                Pending queue is empty.
              </div>
            )}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
