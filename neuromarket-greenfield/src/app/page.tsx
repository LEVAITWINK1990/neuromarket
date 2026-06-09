"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Headphones, Shield, Zap } from "lucide-react";

import { HeroBanner } from "@/components/hero-banner";
import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { demoCategories, demoSellers } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";
import { formatCompact } from "@/lib/format";

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

export default function HomePage() {
  const { allProducts, compare, toggleCompare, toggleWishlist, wishlist } = useDemoStore();

  const featured = allProducts[0];
  const thumbs = allProducts.slice(1, 4);
  const bestsellers = [...allProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, 8);
  const latest = [...allProducts].slice(0, 6);

  return (
    <PageShell>
      <div className="space-y-10">
        <HeroBanner featured={featured} thumbnails={thumbs} />

        <section className="rounded-[28px] border border-white/10 bg-[#11161f] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
                Platform strip
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Топ AI-платформы для быстрой покупки
              </h2>
            </div>
            <Link href="/categories" className="text-sm text-white/55 transition hover:text-white">
              Все категории
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {demoCategories.slice(0, 10).map((category) => (
              <Link
                key={category.id}
                href={`/marketplace?category=${category.slug}`}
                className="rounded-[24px] border border-white/10 bg-[#0d131c] p-4 transition hover:border-[#f97316]/40"
              >
                <div
                  className="h-2 w-16 rounded-full"
                  style={{ backgroundColor: category.accent }}
                />
                <div className="mt-5 text-lg font-black text-white">{category.label}</div>
                <div className="mt-2 text-sm text-white/55">{category.teaser}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,#f97316,#fb923c,#facc15)] p-6 text-black">
            <p className="text-xs font-black uppercase tracking-[0.24em]">SMART subscription</p>
            <h2 className="mt-3 text-3xl font-black">
              Ежедневные deals, приоритетная поддержка и лучшие цены.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-black/75">
              Витрина собрана в духе плотных digital goods marketplaces: быстрый поиск, компактные
              карточки, доверие и продавцы с buyer protection.
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
            >
              В каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {bestsellers.slice(0, 3).map((product, index) => (
              <div
                key={product.id}
                className="rounded-[28px] border border-white/10 bg-[#11161f] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f97316] text-sm font-black text-black">
                    {index + 1}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {product.cover.eyebrow}
                  </span>
                </div>
                <div className="mt-6 text-xl font-black text-white">{product.title}</div>
                <div className="mt-2 text-sm text-white/55">{product.shortDescription}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
                Daily SMART deals
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">Хиты продаж</h2>
            </div>
            <Link href="/marketplace" className="text-sm text-white/55 transition hover:text-white">
              Смотреть всё
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {bestsellers.map((product) => (
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
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5"
            >
              <item.icon className="h-8 w-8 text-[#f97316]" />
              <div className="mt-4 text-lg font-black text-white">{item.title}</div>
              <p className="mt-2 text-sm text-white/55">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
              Top sellers
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">Продавцы с высоким рейтингом</h2>
            <div className="mt-6 space-y-4">
              {demoSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="rounded-[24px] border border-white/10 bg-[#0d131c] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-white">{seller.displayName}</div>
                      <div className="text-sm text-white/55">
                        {seller.country} · rating {seller.rating.toFixed(1)} · response{" "}
                        {seller.responseTime}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                        Total withdrawn
                      </div>
                      <div className="text-lg font-black text-[#f97316]">
                        {formatCompact(seller.withdrawnBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
              Discover
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                [
                  "Почему NeuroMarket",
                  "Плотная тёмная витрина, buyer protection и workflow от discover до delivery.",
                ],
                [
                  "Защита покупателя",
                  "Споры, escrow-like логика и ручная модерация подозрительных листингов.",
                ],
                [
                  "SMART программа",
                  "Дневные скидки, приоритетное сопровождение и отбор лучших продавцов.",
                ],
                [
                  "Стать продавцом",
                  "Создавайте листинги, запросы на выплаты и верификацию из seller hub.",
                ],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[24px] bg-[#0d131c] p-5">
                  <div className="text-lg font-black text-white">{title}</div>
                  <div className="mt-2 text-sm text-white/55">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
                Fresh subscriptions
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">Новые позиции</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">Final CTA</p>
          <h2 className="mt-3 text-3xl font-black text-white">
            Готово к тесту: buyer, seller и admin флоу уже на месте.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60">
            Открой sign-in, зайди под нужной ролью и проверь от витрины до заказа, seller listing
            creation и admin review.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
            >
              Перейти в каталог
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
            >
              Создать сессию
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
