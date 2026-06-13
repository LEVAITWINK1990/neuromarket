"use client";

import Link from "next/link";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { demoUsers } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";

export default function AdminDashboardPage() {
  const { customProducts, disputes, payouts, verifications } = useDemoStore();

  return (
    <PageShell>
      <Guard title="Admin panel" role="ADMIN">
        <div className="space-y-8">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
              Admin overview
            </p>
            <h1 className="mt-3 text-4xl font-black text-white">
              Moderation, payouts, users and disputes
            </h1>
          </section>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              [
                "Pending products",
                String(customProducts.filter((item) => item.status === "PENDING_REVIEW").length),
              ],
              ["Disputes", String(disputes.length)],
              ["Payouts", String(payouts.length)],
              ["Users", String(demoUsers.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[28px] border border-white/10 bg-[#11161f] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                <div className="mt-3 text-3xl font-black text-white">{value}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Link
              href="/admin/products"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Products
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Orders
            </Link>
            <Link
              href="/admin/users"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Users
            </Link>
            <Link
              href="/admin/disputes"
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 text-white"
            >
              Disputes
            </Link>
          </div>
          {verifications.length > 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
              <h2 className="text-2xl font-black text-white">Verification queue</h2>
              <div className="mt-4 space-y-3">
                {verifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] bg-[#0d131c] p-4 text-sm text-white/65"
                  >
                    {item.note}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Guard>
    </PageShell>
  );
}
