import { PageShell } from "@/components/page-shell";

const allowed = [
  "Легальные лицензии и ваучеры",
  "AI-кредиты и официальные access packs",
  "Digital files, курсы и инструкции",
  "Консультации и setup services",
];
const banned = [
  "Stolen accounts",
  "Cracked software",
  "Leaked API keys",
  "Shared credential resale",
  "Misleading descriptions",
];

export default function TrustPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
            Trust & Safety
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">Правила легального AI-marketplace</h1>
          <p className="mt-4 max-w-3xl text-sm text-white/60">
            NeuroMarket ориентирован на легальные цифровые товары. Любой сигнал о stolen access,
            leaked secrets или cracked software приводит к ручной модерации и бану.
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h2 className="text-2xl font-black text-white">Разрешено</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              {allowed.map((item) => (
                <li key={item} className="rounded-[22px] bg-[#0d131c] px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h2 className="text-2xl font-black text-white">Запрещено</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              {banned.map((item) => (
                <li key={item} className="rounded-[22px] bg-[#2a1111] px-4 py-3 text-[#fca5a5]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
