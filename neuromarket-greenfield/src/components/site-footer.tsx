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
    <footer className="border-t border-white/5 bg-[#111111]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-14 lg:px-5">
        <div className="mb-10 grid gap-4 rounded-[18px] bg-[#232323] p-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff8a3d]">
              NeuroMarket newsletter
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Weekly deals on AI subscriptions, credits, files, and services.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Follow price drops, new bundles, verified sellers, and limited SMART discounts.
            </p>
          </div>
          <div className="flex items-center bg-black/20 p-3">
            <div className="flex w-full items-center overflow-hidden rounded-[4px] bg-white text-black">
              <input
                className="w-full bg-transparent px-4 py-3 text-sm font-medium outline-none"
                placeholder="you@company.com"
              />
              <button className="bg-[#ff6a00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1.2fr_repeat(3,0.8fr)]">
          <div>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[28px] font-black uppercase leading-none tracking-[-0.05em] text-[#ff6a00]">
                  Neuro<span className="text-[#ff9a54]">.market</span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                  Verified digital goods marketplace
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-white/60">
              Dark commerce storefront for legal AI subscriptions, vouchers, files, credit packs,
              and expert services.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/65">
              {["Visa", "Mastercard", "YooKassa", "Apple Pay", "Buyer Protection"].map((chip) => (
                <span key={chip} className="rounded-[999px] border border-white/10 px-3 py-2">
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
            Buyer protection, instant delivery labels, moderated sellers, and support-first
            checkout.
          </span>
          <span>Secure payout handling, disputes, reviews, and seller verification.</span>
        </div>
      </div>
    </footer>
  );
}
