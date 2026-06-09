import Link from "next/link";

import { PageShell } from "@/components/page-shell";

export default function SellersPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-[#11161f] p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
            Sell on NeuroMarket
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">
            Кабинет продавца для AI-листингов, ручной доставки и выплат.
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-white/60">
            Создавай витринные карточки, проходи верификацию, отслеживай pending и available
            balance, подавай payout requests и управляй заказами.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/sign-in"
              className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
            >
              Войти как seller
            </Link>
            <Link
              href="/seller"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
            >
              Открыть seller hub
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
