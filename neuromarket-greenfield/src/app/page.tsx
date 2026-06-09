"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  Braces,
  Film,
  Headphones,
  ImageIcon,
  Palette,
  Search,
  Shield,
  Sparkles,
  Star,
  WandSparkles,
  Zap,
} from "lucide-react";

import { HeroBanner } from "@/components/hero-banner";
import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { demoCategories, demoSellers } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";
import { formatCompact, formatMoney } from "@/lib/format";

const trustItems = [
  { icon: Zap, title: "Instant delivery", text: "Коды и ваучеры выдаются сразу после оформления." },
  {
    icon: Shield,
    title: "Buyer protection",
    text: "Споры и ручная проверка доступны для рискованных кейсов.",
  },
  {
    icon: BadgeCheck,
    title: "Verified sellers",
    text: "Проверенные магазины получают отдельную маркировку.",
  },
  {
    icon: Headphones,
    title: "24/7 support",
    text: "Поддержка и seller follow-up идут через marketplace.",
  },
];

const platformIcons = {
  chatgpt: Bot,
  claude: BrainCircuit,
  midjourney: ImageIcon,
  cursor: Braces,
  gemini: Sparkles,
  perplexity: Search,
  canva: Palette,
  capcut: Film,
};

export default function HomePage() {
  const { allProducts, compare, toggleCompare, toggleWishlist, wishlist } = useDemoStore();

  const featured = allProducts[0];
  const thumbs = allProducts.slice(1, 8);
  const bestsellers = [...allProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, 10);
  const latest = [...allProducts].slice(0, 4);
  const dealCards = [...allProducts].filter((product) => product.smart).slice(0, 3);
  const collectionCards = [
    {
      title: "Lowest price picks",
      text: "Ready-to-activate seats and credit bundles with fast delivery.",
      accent: "linear-gradient(140deg, #0f172a, #1d4ed8, #38bdf8)",
      href: "/marketplace?sort=price-asc",
    },
    {
      title: "Bundles & savings",
      text: "Multi-seat packs for agencies, builders, and content teams.",
      accent: "linear-gradient(140deg, #2b1810, #ff6a00, #ffb26b)",
      href: "/marketplace?smart=1",
    },
    {
      title: "Lucky drops",
      text: "Rotating AI kits, templates, and onboarding files for fast launches.",
      accent: "linear-gradient(140deg, #1f1d3a, #7c3aed, #ec4899)",
      href: "/marketplace?sort=newest",
    },
  ];

  return (
    <PageShell>
      <div className="space-y-10">
        <HeroBanner featured={featured} thumbnails={thumbs} />

        <section className="space-y-5">
          <div>
            <h2 className="text-[34px] font-black leading-none text-white sm:text-[46px]">
              AI subscriptions & digital deals at best prices on NeuroMarket!
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] text-white/68">
              Choose verified seller offers across ChatGPT, Claude, Midjourney, Cursor, Gemini,
              Canva, CapCut, and AI service bundles.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-4 xl:grid-cols-8">
            {demoCategories.slice(0, 10).map((category) => (
              <Link
                key={category.id}
                href={`/marketplace?category=${category.slug}`}
                className="flex flex-col items-center gap-3 rounded-[14px] bg-transparent py-2 text-center transition hover:text-[#ffb26b]"
              >
                <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-[#232323]">
                  {(() => {
                    const Icon =
                      platformIcons[category.slug as keyof typeof platformIcons] ?? WandSparkles;
                    return <Icon className="h-8 w-8 text-white" />;
                  })()}
                </div>
                <div className="text-[15px] font-black text-white">{category.label}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#ff8a3d]">
              Daily SMART deals
            </p>
            <h2 className="mt-2 text-[32px] font-black leading-none text-white sm:text-[42px]">
              Extra deals with a daily SMART discount
            </h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {dealCards.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="grid overflow-hidden rounded-[18px] bg-[#2a2a2a] sm:grid-cols-[0.4fr_0.6fr]"
              >
                <div
                  className="relative aspect-[313/378] p-4"
                  style={{
                    backgroundImage: `linear-gradient(145deg, ${product.cover.from}, ${product.cover.via}, ${product.cover.to})`,
                  }}
                >
                  <span className="absolute left-3 top-3 rounded-[10px] bg-[#ef4444] px-3 py-1 text-[11px] font-black text-white">
                    -20%
                  </span>
                  <div className="flex h-full items-end">
                    <div className="text-[74px] font-black leading-none text-white/92">
                      {product.cover.glyph}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.08em] text-white/56">
                      <BadgeCheck className="h-4 w-4 text-[#ff8a3d]" />
                      {product.cover.eyebrow}
                    </div>
                    <h3 className="mt-3 text-[18px] font-black leading-7 text-white">
                      {product.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-6 text-white/68">
                      With coupon code: <span className="font-black text-white">IAMSMART2</span>
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="text-[14px] font-medium text-white/72">
                      from{" "}
                      <span className="text-[34px] font-black leading-none text-white">
                        {formatMoney(product.price)}
                      </span>
                    </div>
                    <div className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#ff6a00] text-[13px] font-black uppercase tracking-[0.08em] text-white">
                      Buy now
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="overflow-hidden rounded-[18px] bg-[linear-gradient(115deg,#2d180b_0%,#ff6a00_48%,#ff9347_100%)] p-6 text-white lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.75fr_0.25fr] lg:items-center">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.12em] text-white/80">
                  SMART subscription
                </p>
                <h2 className="mt-3 text-[32px] font-black leading-none sm:text-[44px]">
                  Daily discount codes, buyer protection, and priority support.
                </h2>
                <p className="mt-4 max-w-3xl text-[15px] leading-6 text-white/86">
                  Unlock recurring discounts across verified AI subscriptions, credit bundles,
                  agency seats, templates, and specialist services.
                </p>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Link
                  href="/marketplace"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#151515] px-6 text-[13px] font-black uppercase tracking-[0.08em] text-white"
                >
                  Join SMART
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#ff8a3d]">
              Bestsellers
            </p>
            <h2 className="mt-2 text-[32px] font-black leading-none text-white sm:text-[42px]">
              Top AI subscriptions, vouchers, and credits
            </h2>
            <p className="mt-3 max-w-4xl text-[15px] leading-6 text-white/66">
              The most popular products on NeuroMarket. See what teams buy first when they need
              instant delivery and verified seller support.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {bestsellers.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="overflow-hidden rounded-[18px] bg-[#232323] transition hover:bg-[#2a2a2a]"
              >
                <div
                  className="relative aspect-[342/240] p-4"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${product.cover.from}, ${product.cover.via}, ${product.cover.to})`,
                  }}
                >
                  <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6a00] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                    {product.cover.eyebrow}
                  </span>
                  <div className="flex h-full items-end justify-end text-[72px] font-black leading-none text-white/88">
                    {product.cover.glyph}
                  </div>
                </div>
                <div className="p-4">
                  <div className="line-clamp-2 text-[16px] font-black leading-6 text-white">
                    {product.title}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[12px] font-medium text-white/60">
                    <Star className="h-3.5 w-3.5 fill-current text-[#ff8a3d]" />
                    {product.rating.toFixed(1)}
                    <span>{product.salesCount} sold</span>
                  </div>
                  <div className="mt-4 text-[28px] font-black leading-none text-[#ff6a00]">
                    {formatMoney(product.price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.42fr]">
          <div className="space-y-5">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#ff8a3d]">
                Fresh subscriptions
              </p>
              <h2 className="mt-2 text-[32px] font-black leading-none text-white sm:text-[42px]">
                Instant delivery picks for teams that need speed
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {latest.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wished={wishlist.includes(product.id)}
                  compared={compare.includes(product.id)}
                  onWishlist={() => toggleWishlist(product.id)}
                  onCompare={() => toggleCompare(product.id)}
                />
              ))}
            </div>
          </div>

          <Link
            href="/marketplace?smart=1"
            className="overflow-hidden rounded-[18px] bg-[#232323] p-5 transition hover:bg-[#2a2a2a]"
          >
            <div className="aspect-[11/9] rounded-[14px] bg-[linear-gradient(135deg,#111827,#ff6a00,#ffb26b)] p-5">
              <div className="text-[12px] font-black uppercase tracking-[0.12em] text-white/72">
                SMART spotlight
              </div>
              <div className="mt-4 max-w-[15rem] text-[32px] font-black leading-none text-white">
                Agency seat bundles and rotating VIP discounts
              </div>
            </div>
            <div className="mt-5 text-[15px] leading-6 text-white/66">
              Fast-moving credit packs, team seats, template drops, and seller-protected deals in
              one dense storefront.
            </div>
          </Link>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#ff8a3d]">
              Collections
            </p>
            <h2 className="mt-2 text-[32px] font-black leading-none text-white sm:text-[42px]">
              Find the best AI deals and team bundles
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {collectionCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="overflow-hidden rounded-[18px] bg-[#232323] transition hover:bg-[#2a2a2a]"
              >
                <div className="aspect-[570/400] p-6" style={{ backgroundImage: card.accent }}>
                  <div className="max-w-[16rem] text-[34px] font-black leading-none text-white">
                    {card.title}
                  </div>
                </div>
                <div className="p-5 text-[15px] leading-6 text-white/68">{card.text}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[18px] bg-[#232323] p-6">
            <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#ff8a3d]">
              Top sellers
            </p>
            <h2 className="mt-2 text-[32px] font-black leading-none text-white">
              Verified stores with fast response times
            </h2>
            <div className="mt-6 space-y-4">
              {demoSellers.map((seller) => (
                <div key={seller.id} className="rounded-[14px] bg-[#1a1a1a] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[18px] font-black text-white">{seller.displayName}</div>
                      <div className="mt-1 text-[14px] text-white/58">
                        {seller.country} · rating {seller.rating.toFixed(1)} · response{" "}
                        {seller.responseTime}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/45">
                        withdrawn
                      </div>
                      <div className="mt-1 text-[22px] font-black text-[#ff6a00]">
                        {formatCompact(seller.withdrawnBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {trustItems.map((item) => (
              <div key={item.title} className="rounded-[18px] bg-[#232323] p-5">
                <div className="flex items-center gap-3">
                  <item.icon className="h-7 w-7 text-[#ff8a3d]" />
                  <div className="text-[20px] font-black text-white">{item.title}</div>
                </div>
                <p className="mt-3 text-[15px] leading-6 text-white/64">{item.text}</p>
              </div>
            ))}
            <Link
              href="/trust-and-safety"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#ff6a00] px-6 text-[13px] font-black uppercase tracking-[0.08em] text-white"
            >
              Trust & safety
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="rounded-[18px] bg-[#232323] px-6 py-8 text-center lg:px-10 lg:py-10">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#ff8a3d]">
            Final CTA
          </p>
          <h2 className="mt-3 text-[34px] font-black leading-none text-white sm:text-[44px]">
            Buy faster, sell smarter, and keep every digital order protected.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-6 text-white/64">
            Explore verified subscriptions, seller bundles, AI credit packs, templates, and service
            offers in one dense commercial storefront.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="inline-flex h-12 items-center rounded-[10px] bg-[#ff6a00] px-6 text-[13px] font-black uppercase tracking-[0.08em] text-white"
            >
              Open marketplace
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center rounded-[10px] bg-[#1a1a1a] px-6 text-[13px] font-black uppercase tracking-[0.08em] text-white"
            >
              Open account
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
