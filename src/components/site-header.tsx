import Link from "next/link";
import { Search, ShoppingCart, ChevronDown, User as UserIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Brand } from "@/components/brand";

const NAV_LINKS = [
  { href: "/marketplace?category=ai-subscriptions", labelKey: "cat_subscriptions_short" },
  { href: "/marketplace?category=api-credits", labelKey: "cat_api_credits_short" },
  { href: "/marketplace?category=image-video", labelKey: "cat_image_video_short" },
  { href: "/marketplace?category=coding-tools", labelKey: "cat_coding_tools_short" },
  { href: "/marketplace?category=services", labelKey: "cat_services_short" },
  { href: "/marketplace?sort=newest", labelKey: "new_arrivals_short" },
] as const;

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const t = await getTranslations("header");

  return (
    <header className="sticky top-0 z-40 w-full bg-header text-header-foreground shadow-[0_2px_0_0_hsl(var(--border))]">
      {/* Main bar */}
      <div className="container flex h-[60px] items-center gap-4">
        <Link href="/" className="shrink-0" aria-label="NeuroMarket">
          <Brand invert size="lg" />
        </Link>

        <form
          action="/marketplace"
          className="relative mx-auto hidden h-11 w-full max-w-2xl flex-1 items-stretch md:flex"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              name="q"
              autoComplete="off"
              placeholder={t("search_placeholder")}
              className="h-full w-full rounded-l-full border-0 bg-white pl-11 pr-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-r-full bg-primary px-6 text-sm font-black uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
          >
            {t("search_button")}
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center gap-2 pr-1 text-xs text-white/70 md:flex">
            <LocaleSwitcher />
            <span className="text-white/30">|</span>
            <span className="text-white/80">USD $</span>
          </div>

          {user ? (
            <>
              <Link href={dashboardHref(user.role)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-white hover:bg-white/10"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden md:inline">{t("dashboard")}</span>
                </Button>
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                >
                  {t("sign_out")}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-white hover:bg-white/10"
                >
                  <UserIcon className="h-4 w-4" />
                  {t("sign_in")}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-full font-black uppercase">
                  {t("get_started")}
                </Button>
              </Link>
            </>
          )}

          <Link
            href={user ? "/dashboard/orders" : "/sign-in"}
            className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
            aria-label={t("cart")}
          >
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">$0.00</span>
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-white/5 px-4 pb-3 md:hidden">
        <form action="/marketplace" className="relative flex h-10 items-stretch">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            placeholder={t("search_placeholder")}
            className="h-full w-full rounded-l-full border-0 bg-white pl-10 pr-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-r-full bg-primary px-4 text-xs font-black uppercase text-primary-foreground"
          >
            {t("search_button")}
          </button>
        </form>
      </div>

      {/* Compact nav row */}
      <nav className="border-t border-white/5">
        <div className="container flex h-9 items-center gap-1 overflow-x-auto no-scrollbar text-sm">
          <details className="group relative shrink-0">
            <summary className="flex h-7 cursor-pointer list-none items-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-black uppercase tracking-wide text-primary-foreground marker:hidden hover:bg-primary/90">
              {t("catalog")}
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-popover p-2 text-popover-foreground shadow-lg">
              <Link
                href="/categories"
                className="block rounded-md px-2 py-1.5 text-sm font-medium hover:bg-primary/15 hover:text-primary"
              >
                {t("all_categories")}
              </Link>
              {NAV_LINKS.slice(0, 5).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-md px-2 py-1.5 text-sm hover:bg-primary/15 hover:text-primary"
                >
                  {t(l.labelKey)}
                </Link>
              ))}
            </div>
          </details>

          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white/85 hover:text-primary"
            >
              {t(l.labelKey)}
            </Link>
          ))}

          <Link
            href="/smart"
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-primary hover:bg-primary/25"
          >
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] leading-none text-primary-foreground">
              SMART
            </span>
            {t("smart_cta")}
          </Link>
        </div>
      </nav>
    </header>
  );
}

function dashboardHref(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "SELLER") return "/seller";
  return "/dashboard";
}
