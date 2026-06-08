import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "./sort-select";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  delivery?: string;
  productType?: string;
  sort?: "popular" | "newest" | "rating" | "price_asc" | "price_desc";
  verified?: string;
};

function parsePriceCents(input: string | undefined): number | undefined {
  if (!input) return undefined;
  const v = Number(input);
  if (Number.isNaN(v) || v < 0) return undefined;
  return Math.round(v * 100);
}

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("marketplace");
  const tType = await getTranslations("product_type");
  const tDelivery = await getTranslations("delivery_type");

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
  };

  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
      { shortDescription: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }
  if (searchParams.category) {
    where.category = { slug: searchParams.category };
  }
  if (searchParams.delivery) {
    where.deliveryType = searchParams.delivery as Prisma.ProductWhereInput["deliveryType"];
  }
  if (searchParams.productType) {
    where.productType = searchParams.productType as Prisma.ProductWhereInput["productType"];
  }
  if (searchParams.verified === "1") {
    where.isVerified = true;
  }
  const min = parsePriceCents(searchParams.minPrice);
  const max = parsePriceCents(searchParams.maxPrice);
  if (min !== undefined || max !== undefined) {
    where.priceCents = {
      ...(min !== undefined ? { gte: min } : {}),
      ...(max !== undefined ? { lte: max } : {}),
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ salesCount: "desc" }];
  switch (searchParams.sort) {
    case "newest":
      orderBy = [{ createdAt: "desc" }];
      break;
    case "rating":
      orderBy = [{ rating: "desc" }, { ratingCount: "desc" }];
      break;
    case "price_asc":
      orderBy = [{ priceCents: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ priceCents: "desc" }];
      break;
    default:
      orderBy = [{ salesCount: "desc" }, { rating: "desc" }];
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: 48,
      include: {
        category: true,
        seller: true,
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const buildQuery = (overrides: Record<string, string>) => {
    const merged: Record<string, string> = {};
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === "string" && v.length > 0) merged[k] = v;
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (v === "") delete merged[k];
      else merged[k] = v;
    }
    const qs = new URLSearchParams(merged).toString();
    return qs ? `/marketplace?${qs}` : "/marketplace";
  };

  const safeT = (fn: (k: string) => string, key: string) => {
    try {
      return fn(key);
    } catch {
      return key;
    }
  };

  const activeCategory = categories.find((c) => c.slug === searchParams.category);
  const activeChips: { label: string; href: string }[] = [];
  if (searchParams.q)
    activeChips.push({ label: `“${searchParams.q}”`, href: buildQuery({ q: "" }) });
  if (activeCategory)
    activeChips.push({ label: activeCategory.name, href: buildQuery({ category: "" }) });
  if (searchParams.delivery)
    activeChips.push({
      label: capitalize(safeT(tDelivery, searchParams.delivery)),
      href: buildQuery({ delivery: "" }),
    });
  if (searchParams.productType)
    activeChips.push({
      label: capitalize(safeT(tType, searchParams.productType)),
      href: buildQuery({ productType: "" }),
    });
  if (searchParams.verified === "1")
    activeChips.push({ label: t("verified_only"), href: buildQuery({ verified: "" }) });
  if (min !== undefined || max !== undefined)
    activeChips.push({
      label: `$${searchParams.minPrice ?? "0"} – $${searchParams.maxPrice ?? "∞"}`,
      href: buildQuery({ minPrice: "", maxPrice: "" }),
    });
  const hasActiveFilters = activeChips.length > 0;

  return (
    <div className="container py-8">
      <header className="mb-6">
        <Badge variant="secondary">{t("badge")}</Badge>
        <h1 className="section-title mt-2">{t("page_title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("page_subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {t("filters")}
              </span>
              {hasActiveFilters && (
                <Link
                  href="/marketplace"
                  className="text-xs font-bold uppercase tracking-wide text-primary hover:underline"
                >
                  {t("reset_filters")}
                </Link>
              )}
            </div>
            <form className="space-y-5 p-4">
              <input type="hidden" name="q" value={searchParams.q ?? ""} />
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("category")}
                </div>
                <div className="no-scrollbar max-h-72 space-y-0.5 overflow-y-auto pr-1">
                  <Link
                    className={`block rounded-md px-2 py-1 text-sm transition-colors hover:bg-secondary ${
                      !searchParams.category ? "bg-primary/15 font-bold text-primary" : ""
                    }`}
                    href={buildQuery({ category: "" })}
                  >
                    {t("all_categories")}
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={buildQuery({ category: c.slug })}
                      className={`block rounded-md px-2 py-1 text-sm transition-colors hover:bg-secondary ${
                        searchParams.category === c.slug
                          ? "bg-primary/15 font-bold text-primary"
                          : "text-foreground/90"
                      }`}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-2 border-t border-border pt-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("price_usd")}
                </div>
                <div className="flex gap-2">
                  <Input
                    name="minPrice"
                    type="number"
                    placeholder={t("min")}
                    defaultValue={searchParams.minPrice}
                  />
                  <Input
                    name="maxPrice"
                    type="number"
                    placeholder={t("max")}
                    defaultValue={searchParams.maxPrice}
                  />
                </div>
              </div>
              <div className="space-y-2 border-t border-border pt-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("delivery")}
                </div>
                <select
                  name="delivery"
                  defaultValue={searchParams.delivery ?? ""}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">{t("any")}</option>
                  <option value="INSTANT">{capitalize(tDelivery("INSTANT"))}</option>
                  <option value="MANUAL">{capitalize(tDelivery("MANUAL"))}</option>
                  <option value="EXTERNAL_LINK">{capitalize(tDelivery("EXTERNAL_LINK"))}</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("product_type")}
                </div>
                <select
                  name="productType"
                  defaultValue={searchParams.productType ?? ""}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">{t("any")}</option>
                  <option value="LICENSE_KEY">{capitalize(tType("LICENSE_KEY"))}</option>
                  <option value="VOUCHER_CODE">{capitalize(tType("VOUCHER_CODE"))}</option>
                  <option value="DIGITAL_FILE">{capitalize(tType("DIGITAL_FILE"))}</option>
                  <option value="MANUAL_DELIVERY">{capitalize(tType("MANUAL_DELIVERY"))}</option>
                  <option value="SERVICE">{capitalize(tType("SERVICE"))}</option>
                  <option value="AFFILIATE_OFFER">{capitalize(tType("AFFILIATE_OFFER"))}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 border-t border-border pt-4 text-sm">
                <input
                  type="checkbox"
                  name="verified"
                  value="1"
                  defaultChecked={searchParams.verified === "1"}
                  className="accent-[hsl(var(--primary))]"
                />
                {t("verified_only")}
              </label>
              <Button type="submit" className="w-full font-black uppercase tracking-wide">
                {t("apply_filters")}
              </Button>
            </form>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <form className="flex w-full gap-2 sm:max-w-sm">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder={t("search_placeholder")}
                  defaultValue={searchParams.q ?? ""}
                  data-testid="search-input"
                  className="pl-8"
                />
              </div>
              <Button type="submit">{t("search_button")}</Button>
            </form>
            <div className="flex shrink-0 items-center gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {products.length === 1
                  ? t("count_one", { count: products.length })
                  : t("count_other", { count: products.length })}
              </p>
              <SortSelect
                defaultValue={searchParams.sort ?? "popular"}
                hiddenParams={Object.fromEntries(
                  Object.entries(searchParams).filter(([k]) => k !== "sort") as [string, string][],
                )}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("active_filters")}:
              </span>
              {activeChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </Link>
              ))}
              <Link
                href="/marketplace"
                className="text-xs font-bold uppercase tracking-wide text-primary hover:underline"
              >
                {t("clear_all")}
              </Link>
            </div>
          )}

          {products.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
              {t("no_results")}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    slug: p.slug,
                    title: p.title,
                    shortDescription: p.shortDescription,
                    priceCents: p.priceCents,
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
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
