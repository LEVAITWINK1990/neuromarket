"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Flag, Heart, Scale, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { demoCategories, demoSellers } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    allProducts,
    compare,
    createOrder,
    currentUser,
    toggleCompare,
    toggleWishlist,
    wishlist,
  } = useDemoStore();

  const product = allProducts.find((item) => item.slug === params.slug);

  if (!product) {
    return (
      <PageShell>
        <div className="rounded-[28px] border border-white/10 bg-[#11161f] p-8 text-white">
          Product not found.
        </div>
      </PageShell>
    );
  }

  const seller = demoSellers.find((item) => item.id === product.sellerId);
  const category = demoCategories.find((item) => item.id === product.categoryId);
  const similar = allProducts
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, 3);

  const handleBuy = () => {
    setError("");
    if (!currentUser) {
      router.push("/sign-in");
      return;
    }

    if (currentUser.sellerId && currentUser.sellerId === product.sellerId) {
      setError("Продавец не может купить собственный товар.");
      return;
    }

    const order = createOrder(product.id);
    if (order) {
      router.push(`/orders/${order.id}`);
    }
  };

  return (
    <PageShell>
      <div className="space-y-8">
        <div className="text-sm text-white/45">
          <Link href="/marketplace" className="hover:text-white">
            marketplace
          </Link>{" "}
          /{" "}
          <Link href={`/marketplace?category=${category?.slug}`} className="hover:text-white">
            {category?.label}
          </Link>{" "}
          / <span className="text-white/70">{product.title}</span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.55fr)] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-[#11161f] p-5">
              <div
                className="rounded-[28px] p-6"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${product.cover.from}, ${product.cover.via}, ${product.cover.to})`,
                }}
              >
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
                  {product.cover.eyebrow}
                </div>
                <div className="mt-8 text-[140px] font-black leading-none text-white/90">
                  {product.cover.glyph}
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs text-white">
                  <span className="rounded-full bg-black/25 px-3 py-2">{product.productType}</span>
                  <span className="rounded-full bg-black/25 px-3 py-2">{product.deliveryType}</span>
                  <span className="rounded-full bg-black/25 px-3 py-2">{product.coverage}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[product.cover.from, product.cover.via, product.cover.to].map((color) => (
                  <div
                    key={color}
                    className="rounded-[22px] border border-white/10 p-5"
                    style={{ backgroundColor: color }}
                  >
                    <div className="text-4xl font-black text-white/90">{product.cover.glyph}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
              <h2 className="text-2xl font-black text-white">Описание</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">{product.description}</p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
              <h2 className="text-2xl font-black text-white">What you receive</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {product.whatYouReceive.map((item) => (
                  <div key={item} className="rounded-[22px] bg-[#0d131c] p-4 text-sm text-white/70">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
              <h2 className="text-2xl font-black text-white">FAQ</h2>
              <div className="mt-4 space-y-3">
                {product.faq.map((item) => (
                  <div key={item.question} className="rounded-[22px] bg-[#0d131c] p-5">
                    <div className="font-bold text-white">{item.question}</div>
                    <div className="mt-2 text-sm text-white/60">{item.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[32px] border border-white/10 bg-[#11161f] p-6 lg:sticky lg:top-28">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                <span>{category?.label}</span>
                <span>•</span>
                <span>{product.coverage}</span>
              </div>
              <h1 className="mt-3 text-4xl font-black text-white">{product.title}</h1>
              <p className="mt-3 text-base text-white/65">{product.shortDescription}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-white/65">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-[#f97316]" />
                  {product.rating.toFixed(1)} ({product.ratingCount})
                </span>
                {product.verified ? (
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="h-4 w-4 text-[#f97316]" />
                    Verified seller
                  </span>
                ) : null}
              </div>

              <div className="mt-6 rounded-[24px] bg-[#0d131c] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Price</div>
                <div className="mt-2 text-sm text-white/45 line-through">
                  {formatMoney(product.originalPrice)}
                </div>
                <div className="text-4xl font-black text-[#f97316]">
                  {formatMoney(product.price)}
                </div>
                <div className="mt-2 text-sm text-white/55">{product.validity}</div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleBuy}
                  className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
                >
                  {currentUser ? "Купить сейчас" : "Sign in to buy"}
                </button>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={`rounded-full border px-4 py-3 text-sm ${
                      wishlist.includes(product.id)
                        ? "border-[#f97316] text-[#f97316]"
                        : "border-white/10 text-white/70"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Wishlist
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(product.id)}
                    className={`rounded-full border px-4 py-3 text-sm ${
                      compare.includes(product.id)
                        ? "border-[#f97316] text-[#f97316]"
                        : "border-white/10 text-white/70"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Compare
                    </span>
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-4 py-3 text-sm text-white/70"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Report
                    </span>
                  </button>
                </div>
                {error ? (
                  <div className="rounded-2xl bg-[#2a1111] px-4 py-3 text-sm text-[#fca5a5]">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#11161f] p-6">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
                Seller
              </div>
              <div className="mt-3 text-2xl font-black text-white">{seller?.displayName}</div>
              <div className="mt-2 text-sm text-white/60">{seller?.bio}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[22px] bg-[#0d131c] p-4 text-white/70">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">Country</div>
                  <div className="mt-2 text-white">{seller?.country}</div>
                </div>
                <div className="rounded-[22px] bg-[#0d131c] p-4 text-white/70">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">Response</div>
                  <div className="mt-2 text-white">{seller?.responseTime}</div>
                </div>
              </div>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
              <h2 className="text-xl font-black text-white">Terms & policy</h2>
              <div className="mt-4 space-y-4 text-sm text-white/65">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Terms of use
                  </div>
                  <div className="mt-1">{product.termsOfUse}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Refund policy
                  </div>
                  <div className="mt-1">{product.refundPolicy}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Validity period
                  </div>
                  <div className="mt-1">{product.validity}</div>
                </div>
              </div>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
              <div className="inline-flex items-center gap-2 text-sm text-white/70">
                <ShieldCheck className="h-4 w-4 text-[#f97316]" />
                Trust & Safety ready
              </div>
              <p className="mt-3 text-sm text-white/60">
                Продажа stolen accounts, cracked software, leaked API keys и shared credentials
                запрещена.
              </p>
              <Link
                href="/trust-and-safety"
                className="mt-4 inline-flex text-sm font-semibold text-[#f97316]"
              >
                Читать policy
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
                Similar products
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">Похожие товары</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {similar.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                wished={wishlist.includes(item.id)}
                compared={compare.includes(item.id)}
                onWishlist={() => toggleWishlist(item.id)}
                onCompare={() => toggleCompare(item.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
