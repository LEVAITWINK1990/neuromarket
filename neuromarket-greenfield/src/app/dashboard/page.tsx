"use client";

import Link from "next/link";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

export default function DashboardPage() {
  const { currentUser, orders, wishlist } = useDemoStore();
  const myOrders = orders.filter((order) => order.buyerId === currentUser?.id);
  const gmv = myOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <PageShell>
      <Guard title="Buyer dashboard" role="BUYER">
        <div className="space-y-8">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
              Buyer overview
            </p>
            <h1 className="mt-3 text-4xl font-black text-white">Привет, {currentUser?.name}</h1>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Orders", String(myOrders.length)],
              ["Wishlist", String(wishlist.length)],
              ["Spent", formatMoney(gmv)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[28px] border border-white/10 bg-[#11161f] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                <div className="mt-3 text-3xl font-black text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/dashboard/orders"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Orders
            </Link>
            <Link
              href="/dashboard/wishlist"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Wishlist
            </Link>
            <Link
              href="/dashboard/disputes"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Disputes
            </Link>
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
