"use client";

import Link from "next/link";
import {
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
  WandSparkles,
  Zap,
} from "lucide-react";

import { HeroBanner } from "@/components/hero-banner";
import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { demoCategories } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

const platformIcons = {
  chatgpt: Bot,
  claude: BrainCircuit,
  midjourney: ImageIcon,
  cursor: Braces,
  gemini: Sparkles,
  perplexity: Search,
  copilot: WandSparkles,
  canva: Palette,
  capcut: Film,
};

const trustItems = [
  {
    icon: Zap,
    title: "Instant delivery",
    text: "Codes, files and ready-to-use digital products unlock right after checkout.",
  },
  {
    icon: Shield,
    title: "Buyer protection",
    text: "Disputes, moderation and seller follow-up stay inside the marketplace flow.",
  },
  {
    icon: BadgeCheck,
    title: "Verified sellers",
    text: "Trusted stores get a separate badge and stronger placement across the catalog.",
  },
  {
    icon: Headphones,
    title: "24/7 support",
    text: "Priority support and manual resolution are available for edge cases and delivery issues.",
  },
];

const collectionCards = [
  {
    title: "Lowest price picks",
    text: "Fast activation seats, credit bundles, and legal subscription deals.",
    accent: "linear-gradient(140deg, #0f1822, #1d4ed8, #38bdf8)",
    href: "/marketplace?sort=price-asc",
  },
  {
    title: "Bundles & savings",
    text: "Multi-seat packs for agencies, builders and content teams.",
    accent: "linear-gradient(140deg, #2b1810, #ff7a00, #ffb26b)",
    href: "/marketplace?smart=1",
  },
  {
    title: "Lucky drops",
    text: "Rotating AI kits, templates and onboarding files for fast launches.",
    accent: "linear-gradient(140deg, #1f1d3a, #7c3aed, #ec4899)",
    href: "/marketplace?sort=newest",
  },
];

export default function HomePage() {
  const { allProducts } = useDemoStore();
  const slides = [...allProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, 6);
  const deals = allProducts.filter((product) => product.smart).slice(0, 3);
  const bestsellers = [...allProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, 10);
  const latest = [...allProducts].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 5);

  return (
    <PageShell>
      <div className="space-y-12">
        <HeroBanner slides={slides} />

        <section className="flex flex-wrap justify-between gap-4">
          {demoCategories.map((category) => {
            const Icon = platformIcons[category.slug as keyof typeof platformIcons] ?? WandSparkles;
            return (
              <Link
                key={category.id}
                href={`/marketplace?category=${category.slug}`}
                className="flex min-w-[90px] flex-1 flex-col items-center gap-2.5 text-center transition hover:text-[#ff7a00]"
              >
                <div className="grid h-14 w-14 place-items-center text-white transition hover:-translate-y-0.5">
                  <Icon className="h-[46px] w-[46px]" />
                </div>
                <span className="text-[14px] font-semibold text-white">{category.label}</span>
              </Link>
            );
          })}
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-[24px] font-bold leading-8 text-white">
              Extra 20% off with a daily SMART discount
            </h2>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            {deals.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="flex overflow-hidden rounded-[8px] border border-[#2a3441] bg-[#1f262e] transition hover:border-[#475569] hover:bg-[#262e38]"
              >
                <div className="relative w-40 shrink-0 overflow-hidden">
                  <img
                    src={product.media.poster}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute right-0 top-0 rounded-bl-[4px] bg-[#e23636] px-2 py-1 text-[13px] font-bold text-white">
                    -20%
                  </span>
                  <span className="absolute right-2 top-2 rounded-full bg-[rgba(16,19,24,0.8)] px-2 py-1 text-[10px] font-bold uppercase text-white">
                    {product.cover.eyebrow}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <h3 className="text-[16px] font-bold leading-[22px] text-white">
                    {product.title}
                  </h3>
                  <div className="mt-4 text-[14px] text-[#94a3b8]">
                    from{" "}
                    <span className="text-[15px] font-bold text-white">
                      {formatMoney(product.price)}
                    </span>
                  </div>
                  <div className="mt-2 text-[13px] text-[#94a3b8]">
                    With coupon code: <span className="font-bold text-white">IAMSMART2</span>
                  </div>
                  <span className="mt-auto inline-flex h-[42px] items-center justify-center rounded-[8px] bg-[#ff7a00] text-[13px] font-bold uppercase tracking-[0.02em] text-white transition hover:bg-[#e66e00]">
                    Buy now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] px-8 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-sans text-[24px] font-black italic leading-none text-[#ff7a00]">
                NEUROMARKET{" "}
                <span className="text-[12px] not-italic tracking-[0.24em] text-[#ff9a4d]">
                  SMART
                </span>
              </div>
              <p className="mt-3 max-w-4xl text-[15px] leading-6 text-[#94a3b8]">
                Activate SMART to gain exclusive daily discounts, buyer protection coverage,
                priority support, and better pricing across verified AI products.
              </p>
            </div>
            <Link
              href="/marketplace?smart=1"
              className="inline-flex h-12 shrink-0 items-center rounded-[8px] border border-[#ff7a00] px-7 text-[14px] font-bold uppercase text-[#ff7a00] transition hover:bg-[#ff7a00] hover:text-white"
            >
              Join now
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-[24px] font-bold leading-8 text-white">Bestselling AI deals</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-[24px] font-bold leading-8 text-white">Fresh subscriptions</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {latest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-4">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="rounded-[8px] border border-[#2a3441] bg-[#1f262e] p-5"
            >
              <item.icon className="h-6 w-6 text-[#ff7a00]" />
              <h3 className="mt-4 text-[18px] font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#94a3b8]">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {collectionCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[12px] p-6 text-white"
              style={{ backgroundImage: card.accent }}
            >
              <h3 className="text-[22px] font-bold">{card.title}</h3>
              <p className="mt-2 max-w-[30ch] text-[14px] leading-6 text-white/85">{card.text}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-8 text-center">
          <h2 className="text-[28px] font-bold text-white">
            Build your AI stack faster on NeuroMarket
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-[15px] leading-6 text-[#94a3b8]">
            Browse subscriptions, team seats, credit packs, files, and specialist services from a
            dense marketplace designed for fast comparison and instant checkout.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="inline-flex h-12 items-center rounded-[8px] bg-[#ff7a00] px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-white"
            >
              Browse catalog
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center rounded-[8px] border border-[#2a3441] px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-white"
            >
              Create account
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
