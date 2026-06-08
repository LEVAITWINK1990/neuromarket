import Link from "next/link";
import { ShieldCheck, Zap, Headphones, Star, Coins, Tag, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { HeroBanner, type HeroSlide } from "@/components/hero-banner";
import { PlatformStrip } from "@/components/platform-strip";
import { SmartCard } from "@/components/smart-card";
import { SectionHeader } from "@/components/section-header";
import { DiscoverTile } from "@/components/discover-tile";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Категории, для которых владелец уже подложил изображения в
// public/product-covers/<slug>/. Hero собирается по top-1 товару из
// каждой, чтобы в карусели не повторялись одинаковые коллажи.
// Если докинут новые папки с обложками — добавь сюда соответствующий слаг.
const HERO_CATEGORY_SLUGS = [
  "chatgpt",
  "claude",
  "midjourney",
  "cursor",
  "gemini",
  "grok",
  "perplexity",
  "copilot-pro",
  "canva",
  "capcut",
  "syntx-ai",
  "aiacademy",
] as const;

async function getLandingData() {
  const heroPerCategory = Promise.all(
    HERO_CATEGORY_SLUGS.map((slug) =>
      prisma.product.findFirst({
        where: {
          status: "PUBLISHED",
          category: { slug },
          images: { some: {} },
        },
        orderBy: [{ salesCount: "desc" }, { rating: "desc" }, { createdAt: "asc" }],
        include: {
          category: true,
          seller: true,
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      }),
    ),
  );

  // One representative product per category that actually has cover art. This
  // gives a diverse, non-repeating pool for every rail on the home page — no
  // more "10 ChatGPT cards with the same picture".
  const categoriesWithArt = await prisma.category.findMany({
    where: { products: { some: { status: "PUBLISHED", images: { some: {} } } } },
    select: { slug: true },
    orderBy: { name: "asc" },
  });

  const [heroProducts, poolRaw] = await Promise.all([
    heroPerCategory,
    Promise.all(
      categoriesWithArt.map((c) =>
        prisma.product.findFirst({
          where: { status: "PUBLISHED", category: { slug: c.slug }, images: { some: {} } },
          orderBy: [{ salesCount: "desc" }, { rating: "desc" }, { createdAt: "asc" }],
          include: {
            category: true,
            seller: true,
            images: { orderBy: { position: "asc" }, take: 1 },
          },
        }),
      ),
    ),
  ]);

  const pool = poolRaw.filter((p): p is NonNullable<typeof p> => p !== null);

  // Slice the diverse pool into non-overlapping rails so a product (and its
  // cover) never shows up twice on the page.
  const bestsellers = pool.slice(0, 10);
  const deals = pool.slice(10, 13);
  const topups = pool.slice(13, 25);
  return { heroProducts, bestsellers, deals, topups };
}

export default async function HomePage() {
  const { heroProducts, bestsellers, deals, topups } = await getLandingData();

  // Hero: top-1 товар из каждой категории с обложками, отбрасываем пустые
  // (категория без товаров), берём первые 8 уникальных категорий.
  const heroSource = heroProducts.filter((p): p is NonNullable<typeof p> => p !== null).slice(0, 8);
  const heroSlides: HeroSlide[] = heroSource.map((p) => ({
    id: p.id,
    cover: p.images[0]?.url ?? null,
    coverAlt: p.title,
    badge: p.category.name,
    title: p.title,
    subtitle: p.shortDescription,
    href: `/products/${p.slug}`,
    cta: "Купить",
    priceLabel: formatPrice(p.priceCents, p.currency),
  }));

  return (
    <div>
      {/* Hero + thumbnail strip */}
      <section className="container pt-3 md:pt-4">
        {heroSlides.length > 0 ? <HeroBanner slides={heroSlides} /> : <EmptyState />}
      </section>

      {/* Platforms */}
      <section className="container pt-10">
        <h2 className="text-center text-2xl font-black tracking-tight md:text-3xl">
          AI-подписки и сервисы по лучшим ценам
        </h2>
        <div className="mt-6">
          <PlatformStrip />
        </div>
      </section>

      {/* SMART daily deals — coupon cards */}
      {deals.length > 0 && (
        <section className="container pt-12">
          <h2 className="text-xl font-black tracking-tight md:text-2xl">
            Дополнительные <span className="text-primary">−20%</span> по ежедневной SMART-скидке
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {deals.map((p) => (
              <SmartDealCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* SMART subscription banner */}
      <section className="container pt-6">
        <SmartCard />
      </section>

      {/* Bestsellers — TOP-10 rank tiles */}
      <section className="container pt-12">
        <SectionHeader
          title="Хиты продаж"
          subtitle="ТОП-10 самых популярных AI-доступов недели."
          viewAllHref="/marketplace?sort=popular"
          viewAllLabel="Все хиты"
        />
        {bestsellers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {bestsellers.map((p, idx) => (
              <BestsellerTile key={p.id} product={p} rank={idx + 1} />
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-center">
          <Link
            href="/marketplace?sort=popular"
            className="inline-flex h-11 items-center rounded-full border border-primary px-7 text-sm font-black uppercase tracking-wide text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            Смотреть все хиты
          </Link>
        </div>
      </section>

      {/* Fresh subscriptions — compact card grid */}
      <section className="container pt-12">
        <SectionHeader
          title="Свежие подписки"
          subtitle="Только что добавлено в каталог."
          viewAllHref="/marketplace?sort=newest"
          viewAllLabel="Смотреть все"
        />
        {topups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {topups.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  title: p.title,
                  shortDescription: p.shortDescription,
                  priceCents: p.priceCents,
                  originalPriceCents: idx % 3 === 0 ? Math.round(p.priceCents * 1.3) : null,
                  currency: p.currency,
                  rating: p.rating,
                  ratingCount: p.ratingCount,
                  stockQuantity: p.stockQuantity,
                  status: p.status,
                  isVerified: p.isVerified,
                  productType: p.productType,
                  deliveryType: p.deliveryType,
                  category: p.category,
                  seller: p.seller,
                  images: p.images,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust strip */}
      <section className="container pt-12">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          <TrustItem icon={Zap} title="Моментальная выдача" text="Коды за секунды." />
          <TrustItem
            icon={ShieldCheck}
            title="Защита покупателя"
            text="Деньги в эскроу до подтверждения."
          />
          <TrustItem
            icon={Star}
            title="Проверенные продавцы"
            text="Каждый магазин на ручной проверке."
          />
          <TrustItem
            icon={Headphones}
            title="Поддержка 24/7"
            text="Реальные люди, быстрые ответы."
          />
        </div>
      </section>

      {/* Big collections banners */}
      <section className="container pt-12">
        <SectionHeader title="Найди лучшие предложения" />
        <div className="grid gap-3 md:grid-cols-3">
          <CollectionBanner
            title="Лучшая цена"
            subtitle="Найдёте дешевле — мы подровняем."
            href="/marketplace?sort=price_asc"
            accent="from-primary/40 via-zinc-900 to-zinc-950"
            icon={Tag}
          />
          <CollectionBanner
            title="Бандлы и скидки"
            subtitle="Длинные подписки с максимальной выгодой."
            href="/marketplace?sort=popular"
            accent="from-rose-700/40 via-zinc-900 to-zinc-950"
            icon={Flame}
          />
          <CollectionBanner
            title="Lucky-набор"
            subtitle="Случайный премиум-инструмент в подарок к покупке."
            href="/marketplace?productType=LICENSE_KEY"
            accent="from-amber-700/40 via-zinc-900 to-zinc-950"
            icon={Coins}
          />
        </div>
      </section>

      {/* Discover blocks */}
      <section className="container pt-12">
        <SectionHeader
          title="Почему NeuroMarket"
          subtitle="Маркетплейс с проверенными продавцами, моментальной выдачей и реальной защитой покупателя."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DiscoverTile
            title="Ежедневные акции"
            body="Каждый листинг по лучшей цене на рынке. И каждый день — дополнительные промокоды."
            bullets={["Лучшие цены рынка", "Ежедневные SMART-скидки", "Купоны для VIP"]}
            href="/marketplace?sort=popular"
            cta="К акциям"
            accent="primary"
          />
          <DiscoverTile
            title="Защита покупателя"
            body="Каждый заказ под защитой. Если что-то пошло не так — мы посредничаем и возвращаем деньги."
            bullets={["Деньги в эскроу", "Решение спора за 24ч", "Полный возврат при сбое"]}
            href="/trust-and-safety"
            cta="Как это работает"
            accent="accent"
          />
          <DiscoverTile
            title="SMART-подписка"
            body="Самые низкие цены, приоритетная поддержка и бесплатная защита покупателя — дешевле кофе."
            bullets={["20% скидки ежедневно", "Поддержка 24/7", "Приоритет на pre-order"]}
            href="/smart"
            cta="Подключить SMART"
            accent="smart"
          />
          <DiscoverTile
            title="Стать продавцом"
            body="Тысячи AI-покупателей каждый день. Самая низкая комиссия, быстрые выплаты."
            bullets={["10% платформы", "Еженедельные выплаты", "Встроенные споры"]}
            href="/sellers"
            cta="Начать продавать"
            accent="primary"
          />
          <DiscoverTile
            title="Поддержка 24/7"
            body="Команда поддержки работает круглосуточно, 365 дней в году. Тикет, чат, e-mail."
            bullets={["Быстрая медиация", "Опытная команда", "Несколько языков"]}
            href="/support"
            cta="Связаться"
            accent="accent"
          />
          <DiscoverTile
            title="Партнёрская программа"
            body="Зарабатывайте процент с каждой покупки по вашей ссылке. Реальный вывод средств."
            bullets={["До 8% комиссии", "Вывод реальных денег", "Готовые баннеры"]}
            href="/affiliate"
            cta="Стать партнёром"
            accent="primary"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-12 pt-10">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/20 via-card to-background p-8 md:p-12">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary-foreground">
                Доверяют тысячи покупателей
              </span>
              <h3 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                Покупайте AI-доступы по лучшим ценам
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Каталог, выбор, мгновенная выдача — всё в одном месте.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/marketplace">
                <Button size="lg">В каталог</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="lg">
                  Создать аккаунт
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type LandingProduct = Awaited<ReturnType<typeof getLandingData>>["bestsellers"][number];

/** GAMIVO-style numbered bestseller tile: portrait cover + rank badge. */
function BestsellerTile({ product, rank }: { product: LandingProduct; rank: number }) {
  const image = product.images[0]?.url;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary"
    >
      <span className="pointer-events-none absolute left-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-background">
        {rank}
      </span>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-secondary via-card to-background">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs font-bold text-muted-foreground">
            {product.category.name}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">от</div>
          <div className="price-tag-accent text-lg leading-none">
            {formatPrice(product.priceCents, product.currency)}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** GAMIVO-style daily SMART deal card: cover + details + BUY NOW + coupon. */
function SmartDealCard({ product }: { product: LandingProduct }) {
  const image = product.images[0]?.url;
  const original = Math.round(product.priceCents * 1.25);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary"
    >
      <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden bg-gradient-to-br from-secondary via-card to-background sm:w-32">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs font-bold text-muted-foreground">
            {product.category.name}
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-[hsl(var(--discount))] px-1.5 py-0.5 text-[10px] font-black leading-none text-[hsl(var(--discount-foreground))]">
          −20%
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 p-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {product.category.name}
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug">{product.title}</h3>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              от
            </span>
            <span className="price-tag-accent text-xl">
              {formatPrice(product.priceCents, product.currency)}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(original, product.currency)}
            </span>
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-dashed border-primary/50 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">
            <Tag className="h-3 w-3" /> Купон IAMSMART2
          </div>
          <span className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-xs font-black uppercase tracking-wide text-primary-foreground transition group-hover:bg-primary/90">
            Купить <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
      Каталог пуст. Запустите{" "}
      <code className="rounded bg-secondary px-1.5 py-0.5">npm run db:seed</code>, чтобы загрузить
      товары из{" "}
      <code className="rounded bg-secondary px-1.5 py-0.5">yandex_market_ai_product_titles.md</code>
      .
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card p-4">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

function CollectionBanner({
  title,
  subtitle,
  href,
  accent,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-44 flex-col justify-end overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${accent} p-6 transition hover:-translate-y-0.5 hover:border-primary`}
    >
      <Icon className="absolute right-4 top-4 h-14 w-14 text-white/15 transition group-hover:scale-110 group-hover:text-primary/70" />
      <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
      <p className="text-sm text-white/70">{subtitle}</p>
      <span className="mt-2 inline-flex items-center text-xs font-black uppercase tracking-wide text-primary opacity-0 transition group-hover:opacity-100">
        Открыть →
      </span>
    </Link>
  );
}
