"use client";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";

export default function SellerOrdersPage() {
  const { allProducts, currentUser, orders } = useDemoStore();
  const mine = orders.filter(
    (order) =>
      allProducts.find((product) => product.id === order.productId)?.sellerId ===
      currentUser?.sellerId,
  );

  return (
    <PageShell>
      <Guard title="Seller orders" role="SELLER">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h1 className="text-4xl font-black text-white">Seller orders</h1>
          </section>
          <div className="space-y-4">
            {mine.length > 0 ? (
              mine.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[28px] border border-white/10 bg-[#11161f] p-5"
                >
                  <div className="text-sm font-black text-white">{order.id}</div>
                  <div className="mt-1 text-sm text-white/60">{order.status}</div>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-[#11161f] p-10 text-center text-white/55">
                Заказов пока нет.
              </div>
            )}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
