"use client";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";

export default function AdminOrdersPage() {
  const { orders } = useDemoStore();

  return (
    <PageShell>
      <Guard title="Admin orders" role="ADMIN">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h1 className="text-4xl font-black text-white">All orders</h1>
          </section>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-sm text-white/65"
              >
                {order.id} · {order.status}
              </div>
            ))}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
