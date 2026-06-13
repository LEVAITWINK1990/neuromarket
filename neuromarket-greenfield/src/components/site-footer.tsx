import Link from "next/link";

const columns = [
  {
    title: "Catalog",
    links: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/categories", label: "Categories" },
      { href: "/marketplace?sort=newest", label: "New arrivals" },
      { href: "/marketplace?smart=1", label: "SMART offers" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/sellers", label: "Become a seller" },
      { href: "/seller", label: "Seller hub" },
      { href: "/seller/verification", label: "Verification" },
      { href: "/seller/payouts", label: "Payouts" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/trust-and-safety", label: "Trust & Safety" },
      { href: "/dashboard/disputes", label: "Disputes" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/admin", label: "Admin panel" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#2a3441] bg-[#181d24]">
      <div className="mx-auto w-full max-w-[1320px] px-5">
        <div className="grid gap-4 border-b border-[#2a3441] py-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
              NeuroMarket newsletter
            </p>
            <h2 className="mt-3 text-[28px] font-bold leading-9 text-white">
              Weekly drops on AI subscriptions, voucher codes and digital files.
            </h2>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#94a3b8]">
              Track verified sellers, buyer protection updates, and SMART discounts in one weekly
              digest.
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex w-full items-center overflow-hidden rounded-[8px] bg-white">
              <input
                className="w-full bg-transparent px-4 py-3 text-[14px] font-semibold text-[#101318] outline-none"
                placeholder="you@company.com"
              />
              <button className="bg-[#ff7a00] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.06em] text-white">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 py-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="inline-flex items-end font-sans italic leading-none text-[#ff7a00]">
              <span className="text-[30px] font-black tracking-[-0.04em] [transform:skewX(-6deg)]">
                NEURO
              </span>
              <span className="mb-[3px] ml-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff9a4d] [transform:skewX(-6deg)]">
                .market
              </span>
            </div>
            <p className="mt-4 max-w-[34ch] text-[13px] leading-6 text-[#64748b]">
              The smart marketplace for legal AI subscriptions, licenses, credits, files, and expert
              delivery.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Visa", "Mastercard", "YooKassa", "Buyer Protection", "24/7 Support"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#2a3441] px-3 py-2 text-[12px] font-semibold text-[#94a3b8]"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
                {column.title}
              </h3>
              <div className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-[13px] text-[#94a3b8] transition hover:text-[#ff7a00]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-[#2a3441] py-4 text-[12px] text-[#64748b] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Buyer protection, verified sellers, instant delivery labels and dispute handling.
          </span>
          <span>NeuroMarket storefront prototype for AI digital goods.</span>
        </div>
      </div>
    </footer>
  );
}
