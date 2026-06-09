import Link from "next/link";

const columns = [
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace", label: "Каталог" },
      { href: "/categories", label: "Категории" },
      { href: "/sellers", label: "Стать продавцом" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/trust-and-safety", label: "Trust & Safety" },
      { href: "/dashboard/disputes", label: "Disputes" },
      { href: "/sign-in", label: "Account access" },
    ],
  },
  {
    title: "Roles",
    links: [
      { href: "/dashboard", label: "Buyer dashboard" },
      { href: "/seller", label: "Seller hub" },
      { href: "/admin", label: "Admin panel" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080b11]">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-10 grid gap-4 rounded-[28px] border border-white/10 bg-[#11161f] p-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
              NeuroMarket newsletter
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Скидки, дропы и новые AI-бандлы без шума.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Подписки, лицензии, кредиты и сервисы приходят в ленту так же плотно, как на больших
              digital goods marketplaces.
            </p>
          </div>
          <div className="flex items-center rounded-[24px] bg-black/20 p-3">
            <div className="flex w-full items-center rounded-full bg-white px-3 py-2 text-black">
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="you@company.com"
              />
              <button className="rounded-full bg-[#f97316] px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-black">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1.2fr_repeat(3,0.8fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f97316] font-black text-black">
                N
              </span>
              <div>
                <div className="text-sm font-black uppercase tracking-[0.18em] text-white">
                  NeuroMarket
                </div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                  AI goods marketplace
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-white/60">
              Dark commerce storefront for legal AI subscriptions, vouchers, files, credit packs,
              and expert services.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/65">
              {["Visa", "Mastercard", "YooKassa", "Apple Pay", "Buyer Protection"].map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 px-3 py-2">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
                {column.title}
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-white/75 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Trustpilot-style experience, instant delivery labels, moderated sellers, and
            support-first checkout.
          </span>
          <span>Built from scratch for demo validation inside `neuromarket-greenfield`.</span>
        </div>
      </div>
    </footer>
  );
}
