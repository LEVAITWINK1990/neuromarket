"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  ChevronDown,
  Globe,
  Heart,
  LogOut,
  Scale,
  Search,
  ShoppingCart,
  Sparkles,
  User2,
} from "lucide-react";

import { useDemoStore } from "@/lib/demo-store";

const primaryLinks = [
  { href: "/marketplace?category=chatgpt", label: "AI Subscriptions", chevron: false },
  { href: "/marketplace?category=perplexity", label: "API Credits", chevron: false },
  { href: "/marketplace?category=midjourney", label: "Images", chevron: false },
  { href: "/marketplace?category=cursor", label: "Dev Tools", chevron: false },
  { href: "/marketplace?category=services", label: "Services", chevron: false },
  { href: "/marketplace?sort=newest", label: "New In", chevron: false },
];

function dashboardHref(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "SELLER") return "/seller";
  return "/dashboard";
}

function dashboardLabel(role?: string) {
  if (role === "ADMIN") return "Admin";
  if (role === "SELLER") return "Seller";
  return "Dashboard";
}

export function SiteHeader() {
  const { compare, currentUser, orders, signOut, wishlist } = useDemoStore();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const cartCount = orders.length;

  const activeCatalogHref = useMemo(() => {
    if (pathname?.startsWith("/marketplace")) return "/marketplace";
    return "";
  }, [pathname]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/marketplace${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#181d24]">
      <div className="mx-auto w-full max-w-[1320px] px-5">
        <div className="flex h-[78px] items-center gap-5">
          <Link href="/" className="shrink-0 select-none">
            <span className="inline-flex items-end font-sans italic leading-none text-[#ff7a00]">
              <span className="text-[30px] font-black tracking-[-0.04em] [transform:skewX(-6deg)]">
                NEURO
              </span>
              <span className="mb-[3px] ml-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff9a4d] [transform:skewX(-6deg)]">
                .market
              </span>
            </span>
          </Link>

          <form onSubmit={handleSubmit} className="hidden min-w-0 flex-1 md:flex">
            <div className="flex h-12 w-full max-w-[1120px] items-center rounded-[8px] border-2 border-transparent bg-white p-[5px] text-black transition focus-within:border-[#ff7a00]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-[38px] w-full bg-transparent px-4 text-[15px] font-semibold text-[#101318] outline-none placeholder:text-[#94a3b8]"
                placeholder="Search for subscriptions, credits, licenses and more..."
              />
              <button
                type="submit"
                className="grid h-[38px] w-12 shrink-0 place-items-center rounded-[6px] bg-[#ff7a00] text-white transition hover:bg-[#e66e00]"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-4 text-white">
            <span className="hidden items-center gap-1.5 text-[15px] font-bold lg:inline-flex">
              <Globe className="h-4 w-4 text-[#94a3b8]" />
              EN
              <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" />
            </span>
            <span className="hidden items-center gap-1.5 text-[15px] font-bold lg:inline-flex">
              USD $
              <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" />
            </span>
            <Link
              href="/dashboard/wishlist"
              className="relative hidden h-9 w-9 items-center justify-center transition hover:text-[#ff7a00] lg:inline-flex"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#00dd80] px-1 text-center text-[10px] font-black leading-[18px] text-[#101318]">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>
            <Link
              href="/compare"
              className="relative hidden h-9 w-9 items-center justify-center transition hover:text-[#ff7a00] lg:inline-flex"
            >
              <Scale className="h-5 w-5" />
              {compare.length > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#00dd80] px-1 text-center text-[10px] font-black leading-[18px] text-[#101318]">
                  {compare.length}
                </span>
              ) : null}
            </Link>
            {currentUser ? (
              <div className="hidden items-center gap-3 lg:flex">
                <Link href={dashboardHref(currentUser.role)} className="text-[15px] text-white">
                  Hello,{" "}
                  <span className="font-bold text-[#ff7a00]">
                    {dashboardLabel(currentUser.role)}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex h-9 w-9 items-center justify-center text-white/70 transition hover:text-[#ff7a00]"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link href="/sign-in" className="hidden text-[15px] lg:inline-flex">
                Hello, <span className="font-bold text-[#ff7a00]">Sign in</span>
              </Link>
            )}
            <span className="hidden rounded-[6px] bg-[#ff7a00] px-3 py-[7px] text-[14px] font-bold text-white lg:inline-flex">
              USD $0.00
            </span>
            <Link
              href={currentUser ? "/dashboard/orders" : "/sign-in"}
              className="relative inline-flex h-[34px] w-[34px] items-center justify-center transition hover:text-[#ff7a00]"
              aria-label="Orders"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-[#00dd80] px-1 text-center text-[10px] font-black leading-[18px] text-[#101318]">
                  {cartCount}
                </span>
              ) : null}
            </Link>
            {!currentUser ? (
              <Link
                href="/sign-in"
                className="inline-flex h-[34px] w-[34px] items-center justify-center transition hover:text-[#ff7a00] lg:hidden"
              >
                <User2 className="h-5 w-5" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="hidden h-14 items-center gap-8 border-t border-[#2a3441] md:flex">
          <nav className="flex min-w-0 flex-1 items-center gap-8 overflow-x-auto whitespace-nowrap text-[15px] font-bold text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/marketplace"
              className={`flex items-center gap-1.5 transition hover:text-[#ff7a00] ${
                activeCatalogHref ? "text-white" : "text-white"
              }`}
            >
              CATALOG
              <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" />
            </Link>
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 transition hover:text-[#ff7a00] ${
                  pathname === link.href ? "text-[#ff7a00]" : "text-white"
                }`}
              >
                {link.label}
                {link.chevron ? <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" /> : null}
              </Link>
            ))}
            <Link
              href="/marketplace?smart=1"
              className="flex items-center gap-2 text-white transition hover:text-[#ff7a00]"
            >
              <Sparkles className="h-4 w-4 text-[#ff7a00]" />
              SMART
            </Link>
          </nav>
        </div>

        <div className="space-y-3 border-t border-[#2a3441] py-3 md:hidden">
          <form
            onSubmit={handleSubmit}
            className="flex h-12 overflow-hidden rounded-[8px] bg-white"
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent px-4 text-sm font-semibold text-[#101318] outline-none placeholder:text-[#94a3b8]"
              placeholder="Search in marketplace"
            />
            <button type="submit" className="grid w-12 place-items-center bg-[#ff7a00] text-white">
              <Search className="h-5 w-5" />
            </button>
          </form>
          <div className="flex gap-5 overflow-x-auto whitespace-nowrap text-sm font-bold text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/marketplace" className="text-[#ff7a00]">
              Catalog
            </Link>
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/marketplace?smart=1">SMART</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
