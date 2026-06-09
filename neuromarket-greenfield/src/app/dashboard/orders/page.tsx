"use client";

import Link from "next/link";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

export default function OrdersPage() {
  const { allProducts, currentUser, orders } = useDemoStore();
  const myOrders = orders.filter((order) => order.buyerId === currentUser?.id);

  return (
    <PageShell>
      <Guard title="Orders" role="BUYER">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h1 className="text-4xl font-black text-white">Мои заказы</h1>
          </section>
          <div className="space-y-4">
            {myOrders.length > 0 ? (
              myOrders.map((order) => {
                const product = allProducts.find((item) => item.id === order.productId);
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-[28px] border border-white/10 bg-[#11161f] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-lg font-black text-white">{product?.title}</div>
                        <div className="mt-1 text-sm text-white/55">{order.deliveryHint}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {order.status}
                        </div>
                        <div className="mt-2 text-xl font-black text-[#f97316]">
                          {formatMoney(order.total)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-[#11161f] p-10 text-center text-white/55">
                Пока нет заказов.
              </div>
            )}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
