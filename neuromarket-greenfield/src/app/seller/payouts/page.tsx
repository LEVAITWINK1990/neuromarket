"use client";

import { FormEvent, useState } from "react";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";

export default function SellerPayoutsPage() {
  const { currentUser, payouts, requestPayout } = useDemoStore();
  const [amount, setAmount] = useState("250");
  const [method, setMethod] = useState("YooKassa transfer");
  const mine = payouts.filter((item) => item.sellerId === currentUser?.sellerId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestPayout(Number(amount), method);
  };

  return (
    <PageShell>
      <Guard title="Seller payouts" role="SELLER">
        <div className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[30px] border border-white/10 bg-[#11161f] p-6"
          >
            <h1 className="text-4xl font-black text-white">Payout request</h1>
            <div className="mt-5 grid gap-4">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
              />
              <input
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
              />
              <button className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black">
                Request payout
              </button>
            </div>
          </form>
          <div className="space-y-4">
            {mine.map((payout) => (
              <div
                key={payout.id}
                className="rounded-[28px] border border-white/10 bg-[#11161f] p-5"
              >
                <div className="text-sm font-black text-white">{payout.method}</div>
                <div className="mt-1 text-sm text-white/60">
                  {payout.amount} · {payout.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
