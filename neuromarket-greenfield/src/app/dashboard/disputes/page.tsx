"use client";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";

export default function DisputesPage() {
  const { currentUser, disputes } = useDemoStore();
  const mine = disputes.filter((item) => item.buyerId === currentUser?.id);

  return (
    <PageShell>
      <Guard title="Disputes" role="BUYER">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h1 className="text-4xl font-black text-white">Disputes</h1>
          </section>
          <div className="space-y-4">
            {mine.length > 0 ? (
              mine.map((dispute) => (
                <div
                  key={dispute.id}
                  className="rounded-[28px] border border-white/10 bg-[#11161f] p-5"
                >
                  <div className="text-sm font-black text-white">{dispute.status}</div>
                  <div className="mt-2 text-sm text-white/60">{dispute.reason}</div>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-[#11161f] p-10 text-center text-white/55">
                Активных disputes нет.
              </div>
            )}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
