"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  ShoppingCart,
  Sparkles,
  User2,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { useDemoStore } from "@/lib/demo-store";

const primaryLinks = [
  { href: "/marketplace?category=chatgpt", label: "AI-подписки" },
  { href: "/marketplace?category=perplexity", label: "API-кредиты" },
  { href: "/marketplace?category=midjourney", label: "Изображения" },
  { href: "/marketplace?category=cursor", label: "Dev Tools" },
  { href: "/marketplace?category=services", label: "Услуги" },
  { href: "/marketplace?sort=newest", label: "Новинки" },
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f16]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f97316] font-black text-black">
              N
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">
                Neuro
              </span>
              <span className="block text-xs uppercase tracking-[0.28em] text-white/55">
                Market
              </span>
            </span>
          </Link>

          <form
            onSubmit={handleSubmit}
            className="hidden flex-1 items-center rounded-full bg-white px-3 py-2 text-black md:flex"
          >
            <Search className="h-4 w-4 text-black/55" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent px-3 text-sm outline-none"
              placeholder="Поиск подписок, кредитов, лицензий и AI-сервисов"
            />
            <button
              type="submit"
              className="rounded-full bg-[#f97316] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-black"
            >
              Найти
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden rounded-full border border-white/10 px-3 py-2 text-white/70 lg:inline-flex">
              RU
            </span>
            <span className="hidden rounded-full border border-white/10 px-3 py-2 text-white/70 lg:inline-flex">
              USD $
            </span>
            <Link
              href="/compare"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-[#f97316] hover:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/wishlist"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-[#f97316] hover:text-white"
            >
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[10px] font-bold">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>

            {currentUser ? (
              <>
                <Link
                  href={dashboardHref(currentUser.role)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-[#f97316]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {currentUser.role === "ADMIN"
                    ? "Admin"
                    : currentUser.role === "SELLER"
                      ? "Seller"
                      : "Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-white/80 transition hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-4 py-2 font-bold text-black"
              >
                <User2 className="h-4 w-4" />
                Войти
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap text-sm">
          <Link
            href="/marketplace"
            className="rounded-full bg-[#f97316] px-4 py-2 font-black uppercase tracking-[0.18em] text-black"
          >
            Каталог
          </Link>
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 transition ${
                pathname === link.href ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#1f2937] px-4 py-2 text-white">
            <Sparkles className="h-4 w-4 text-[#f97316]" />
            SMART -20%
          </span>
        </div>

        <div className="md:hidden">
          <form
            onSubmit={handleSubmit}
            className="flex items-center rounded-full bg-white px-3 py-2 text-black"
          >
            <Search className="h-4 w-4 text-black/55" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent px-3 text-sm outline-none"
              placeholder="Поиск в каталоге"
            />
            <button
              type="submit"
              className="rounded-full bg-[#f97316] px-4 py-2 text-xs font-black uppercase text-black"
            >
              Go
            </button>
          </form>
        </div>

        {compare.length > 0 ? (
          <Link
            href="/compare"
            className="rounded-2xl border border-[#f97316]/40 bg-[#1c2430] px-4 py-3 text-sm text-white"
          >
            В сравнении {compare.length} товара. Открыть compare.
          </Link>
        ) : null}
      </div>
    </header>
  );
}
