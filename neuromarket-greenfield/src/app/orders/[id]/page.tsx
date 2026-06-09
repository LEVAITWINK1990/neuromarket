"use client";

import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const { allProducts, confirmOrder, currentUser, openDispute, orders } = useDemoStore();
  const [reason, setReason] = useState("Need manual review");
  const order = orders.find((item) => item.id === params.id);
  const product = allProducts.find((item) => item.id === order?.productId);

  const handleDispute = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order) return;
    openDispute(order.id, reason);
  };

  return (
    <PageShell>
      <Guard title="Order details" role="BUYER">
        {order && order.buyerId === currentUser?.id ? (
          <div className="space-y-6">
            <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">Order</p>
              <h1 className="mt-3 text-4xl font-black text-white">{product?.title}</h1>
            </section>

            <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
              <div className="space-y-6">
                <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Status</div>
                  <div className="mt-2 text-3xl font-black text-white">{order.status}</div>
                  <div className="mt-4 rounded-[22px] bg-[#0d131c] p-4 text-sm text-white/70">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Delivered asset
                    </div>
                    <div className="mt-2 break-all text-white">{order.deliveredAsset}</div>
                  </div>
                </div>
                <form
                  onSubmit={handleDispute}
                  className="rounded-[30px] border border-white/10 bg-[#11161f] p-6"
                >
                  <h2 className="text-2xl font-black text-white">Открыть dispute</h2>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-4 min-h-28 w-full rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
                  />
                  <button className="mt-4 rounded-full border border-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white">
                    Submit dispute
                  </button>
                </form>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Total</div>
                <div className="mt-2 text-3xl font-black text-[#f97316]">
                  {formatMoney(order.total)}
                </div>
                <button
                  type="button"
                  onClick={() => confirmOrder(order.id)}
                  className="mt-6 w-full rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
                >
                  Confirm delivery
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-8 text-white">
            Order not found.
          </div>
        )}
      </Guard>
    </PageShell>
  );
}
