"use client";

import { FormEvent, useState } from "react";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";

export default function SellerVerificationPage() {
  const { currentUser, requestVerification, verifications } = useDemoStore();
  const [note, setNote] = useState(
    "Official reseller documents and payment details ready for review.",
  );
  const mine = verifications.filter((item) => item.sellerId === currentUser?.sellerId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestVerification(note);
  };

  return (
    <PageShell>
      <Guard title="Verification" role="SELLER">
        <div className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[30px] border border-white/10 bg-[#11161f] p-6"
          >
            <h1 className="text-4xl font-black text-white">Seller verification</h1>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-5 min-h-32 w-full rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
            />
            <button className="mt-4 rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black">
              Submit verification
            </button>
          </form>
          <div className="space-y-4">
            {mine.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-white/10 bg-[#11161f] p-5">
                <div className="text-sm font-black text-white">{item.status}</div>
                <div className="mt-1 text-sm text-white/60">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
