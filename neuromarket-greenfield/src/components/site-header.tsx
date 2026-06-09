"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Globe,
  Heart,
  LogOut,
  Search,
  ShoppingCart,
  Sparkles,
  Scale,
  User2,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { useDemoStore } from "@/lib/demo-store";

const primaryLinks = [
  { href: "/marketplace?category=chatgpt", label: "AI Subscriptions" },
  { href: "/marketplace?category=perplexity", label: "API Credits" },
  { href: "/marketplace?category=midjourney", label: "Images" },
  { href: "/marketplace?category=cursor", label: "Dev Tools" },
  { href: "/marketplace?category=services", label: "Services" },
  { href: "/marketplace?sort=newest", label: "New In" },
];

function dashboardHref(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "SELLER") return "/seller";
  return "/dashboard";
}

export function SiteHeader() {
  const { compare, currentUser, signOut, wishlist } = useDemoStore();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/50 bg-[#161616]">
      <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-5">
        <div className="flex items-center gap-4 py-4">
          <Link href="/" className="flex shrink-0 items-end gap-1 leading-none">
            <span className="text-[42px] font-black uppercase tracking-[-0.06em] text-[#ff6a00] sm:text-[54px]">
              Neuro
            </span>
            <span className="mb-1 text-[13px] font-black uppercase tracking-[-0.02em] text-[#ff8a3d] sm:mb-1.5 sm:text-[17px]">
              .market
            </span>
          </Link>

          <form onSubmit={handleSubmit} className="hidden min-w-0 flex-1 md:flex">
            <div className="flex h-[60px] w-full overflow-hidden rounded-[3px] bg-white">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent px-5 text-[16px] font-bold text-black outline-none placeholder:text-[#7c7c7c]"
                placeholder="Search for subscriptions, credits and more..."
              />
              <button
                type="submit"
                className="flex w-[62px] items-center justify-center bg-[#ff6a00] text-white"
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-3 text-sm font-bold text-white">
            <span className="hidden items-center gap-1.5 text-[16px] lg:inline-flex">
              <Globe className="h-4 w-4 text-[#ff8a3d]" />
              EN
              <ChevronDown className="h-4 w-4 text-white/65" />
            </span>
            <span className="hidden items-center gap-1.5 text-[16px] lg:inline-flex">
              USD
              <ChevronDown className="h-4 w-4 text-white/65" />
            </span>
            <Link
              href="/dashboard/wishlist"
              className="relative hidden h-11 w-11 items-center justify-center text-white transition hover:text-[#ff8a3d] lg:inline-flex"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6a00] px-1 text-[10px] font-black text-white">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>
            <Link
              href="/compare"
              className="relative hidden h-11 w-11 items-center justify-center text-white transition hover:text-[#ff8a3d] lg:inline-flex"
            >
              <Scale className="h-5 w-5" />
              {compare.length > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6a00] px-1 text-[10px] font-black text-white">
                  {compare.length}
                </span>
              ) : null}
            </Link>

            {currentUser ? (
              <>
                <Link
                  href={dashboardHref(currentUser.role)}
                  className="hidden items-center gap-2 text-[16px] text-white lg:inline-flex"
                >
                  Hello,&nbsp;
                  <span className="text-[#ff8a3d]">
                    {currentUser.role === "ADMIN"
                      ? "Admin"
                      : currentUser.role === "SELLER"
                        ? "Seller"
                        : "Dashboard"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="hidden items-center gap-2 text-white/72 transition hover:text-white lg:inline-flex"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link href="/sign-in" className="hidden text-[16px] lg:inline-flex">
                Hello,&nbsp;<span className="text-[#ff8a3d]">Sign in</span>
              </Link>
            )}

            <span className="hidden h-9 items-center bg-[#ff6a00] px-3 text-[16px] font-black text-white lg:inline-flex">
              $0.00
            </span>
            <Link
              href={currentUser ? "/dashboard/orders" : "/sign-in"}
              className="inline-flex h-11 w-11 items-center justify-center text-white transition hover:text-[#ff8a3d]"
            >
              <ShoppingCart className="h-6 w-6" />
            </Link>
            {!currentUser ? (
              <Link
                href="/sign-in"
                className="inline-flex h-11 w-11 items-center justify-center text-white transition hover:text-[#ff8a3d] lg:hidden"
              >
                <User2 className="h-5 w-5" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-10 border-t border-white/5 py-4 text-[16px] font-bold text-white md:flex">
          {[
            { href: "/marketplace", label: "Catalog", accent: true },
            ...primaryLinks.map((link) => ({ ...link, accent: false })),
            { href: "/marketplace?smart=1", label: "SMART", accent: true },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 transition ${
                link.accent
                  ? "text-white hover:text-[#ffb26b]"
                  : pathname === link.href
                    ? "text-white"
                    : "text-white hover:text-[#ffb26b]"
              }`}
            >
              {link.label === "SMART" ? <Sparkles className="h-4 w-4 text-[#ff8a3d]" /> : null}
              {link.label}
              {link.label !== "SMART" && link.label !== "Dev Tools" ? (
                <ChevronDown className="h-4 w-4 text-white/50" />
              ) : null}
            </Link>
          ))}
        </div>

        <div className="space-y-3 border-t border-white/5 py-3 md:hidden">
          <form
            onSubmit={handleSubmit}
            className="flex h-12 overflow-hidden rounded-[3px] bg-white text-black"
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent px-4 text-sm font-bold outline-none placeholder:text-[#7c7c7c]"
              placeholder="Search in marketplace"
            />
            <button
              type="submit"
              className="flex w-12 items-center justify-center bg-[#ff6a00] text-white"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          <div className="flex gap-5 overflow-x-auto whitespace-nowrap text-sm font-bold text-white">
            <Link href="/marketplace" className="text-[#ff8a3d]">
              Catalog
            </Link>
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {compare.length > 0 ? (
          <Link
            href="/compare"
            className="mb-3 inline-flex items-center gap-2 rounded-[10px] bg-[#252525] px-4 py-3 text-sm font-bold text-white"
          >
            Compare {compare.length} selected products
          </Link>
        ) : null}
      </div>
    </header>
  );
}
