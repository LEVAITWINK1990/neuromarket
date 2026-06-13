"use client";

import Link from "next/link";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { demoSellers } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

export default function SellerDashboardPage() {
  const { currentUser } = useDemoStore();
  const seller = demoSellers.find((item) => item.id === currentUser?.sellerId);

  return (
    <PageShell>
      <Guard title="Seller hub" role="SELLER">
        <div className="space-y-8">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
              Seller overview
            </p>
            <h1 className="mt-3 text-4xl font-black text-white">{seller?.displayName}</h1>
            <p className="mt-3 text-sm text-white/60">{seller?.bio}</p>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Available balance", formatMoney(seller?.availableBalance ?? 0)],
              ["Pending balance", formatMoney(seller?.pendingBalance ?? 0)],
              ["Withdrawn", formatMoney(seller?.withdrawnBalance ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[28px] border border-white/10 bg-[#11161f] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                <div className="mt-3 text-3xl font-black text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Link
              href="/seller/products"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Products
            </Link>
            <Link
              href="/seller/products/new"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              New listing
            </Link>
            <Link
              href="/seller/orders"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Orders
            </Link>
            <Link
              href="/seller/payouts"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Payouts
            </Link>
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
