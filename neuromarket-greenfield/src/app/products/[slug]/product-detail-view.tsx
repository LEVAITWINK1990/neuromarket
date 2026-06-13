"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Flag, Heart, Scale, ShieldCheck, Star } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { demoCategories, demoSellers } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

export function ProductDetailView({ slug }: { slug: string }) {
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

  const product = allProducts.find((item) => item.slug === slug);
  const [selectedImage, setSelectedImage] = useState(product?.media.gallery[0] ?? "");

  useEffect(() => {
    if (product) {
      setSelectedImage(product.media.gallery[0] ?? product.media.hero);
    }
  }, [product]);

  const similar = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
      .slice(0, 5);
  }, [allProducts, product]);

  if (!product) {
    return (
      <PageShell>
        <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-8 text-white">
          Product not found.
        </div>
      </PageShell>
    );
  }

  const seller = demoSellers.find((item) => item.id === product.sellerId);
  const category = demoCategories.find((item) => item.id === product.categoryId);

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
        <div className="text-[13px] text-[#64748b]">
          <Link href="/marketplace" className="hover:text-white">
            marketplace
          </Link>{" "}
          /{" "}
          <Link href={`/marketplace?category=${category?.slug}`} className="hover:text-white">
            {category?.label}
          </Link>{" "}
          / <span className="text-[#94a3b8]">{product.title}</span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.55fr)] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-5">
              <div className="relative overflow-hidden rounded-[12px]">
                <div className="aspect-[16/10]">
                  <img
                    src={selectedImage}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-[4px] bg-[#e23636] px-3 py-1 text-[11px] font-bold uppercase text-white">
                    {product.cover.eyebrow}
                  </span>
                  <span className="rounded-[4px] bg-[rgba(16,19,24,0.82)] px-3 py-1 text-[11px] font-bold uppercase text-white">
                    {product.deliveryType}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {product.media.gallery.map((image, imageIndex) => (
                  <button
                    key={`${image}-${imageIndex}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-[10px] border ${
                      selectedImage === image ? "border-white" : "border-[#2a3441]"
                    }`}
                  >
                    <div className="aspect-[16/10]">
                      <img
                        src={image}
                        alt={`${product.title} preview ${imageIndex + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-6">
              <h2 className="text-[28px] font-bold text-white">Description</h2>
              <p className="mt-4 text-[14px] leading-7 text-[#94a3b8]">{product.description}</p>
            </div>

            <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-6">
              <h2 className="text-[28px] font-bold text-white">What you receive</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {product.whatYouReceive.map((item) => (
                  <div
                    key={item}
                    className="rounded-[10px] bg-[#101318] p-4 text-[14px] leading-6 text-[#94a3b8]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-6">
              <h2 className="text-[28px] font-bold text-white">FAQ</h2>
              <div className="mt-4 space-y-3">
                {product.faq.map((item) => (
                  <div key={item.question} className="rounded-[10px] bg-[#101318] p-5">
                    <div className="font-bold text-white">{item.question}</div>
                    <div className="mt-2 text-[14px] leading-6 text-[#94a3b8]">{item.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-6 lg:sticky lg:top-28">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
                <span>{category?.label}</span>
                <span>•</span>
                <span>{product.coverage}</span>
              </div>
              <h1 className="mt-3 text-[36px] font-bold leading-tight text-white">
                {product.title}
              </h1>
              <p className="mt-3 text-[16px] leading-7 text-[#94a3b8]">
                {product.shortDescription}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[14px] text-[#94a3b8]">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-[#ff7a00]" />
                  {product.rating.toFixed(1)} ({product.ratingCount})
                </span>
                {product.verified ? (
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="h-4 w-4 text-[#ff7a00]" />
                    Verified seller
                  </span>
                ) : null}
              </div>

              <div className="mt-6 rounded-[10px] bg-[#101318] p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
                  Price
                </div>
                <div className="mt-2 text-[14px] text-[#64748b] line-through">
                  {formatMoney(product.originalPrice)}
                </div>
                <div className="text-[40px] font-bold leading-none text-[#ff7a00]">
                  {formatMoney(product.price)}
                </div>
                <div className="mt-2 text-[14px] text-[#94a3b8]">{product.validity}</div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleBuy}
                  className="h-12 rounded-[8px] bg-[#ff7a00] px-5 text-[13px] font-bold uppercase tracking-[0.08em] text-white"
                >
                  {currentUser ? "Buy now" : "Sign in to buy"}
                </button>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={`rounded-[8px] border px-4 py-3 text-[13px] font-semibold ${
                      wishlist.includes(product.id)
                        ? "border-[#ff7a00] text-[#ff7a00]"
                        : "border-[#2a3441] text-[#94a3b8]"
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
                    className={`rounded-[8px] border px-4 py-3 text-[13px] font-semibold ${
                      compare.includes(product.id)
                        ? "border-[#ff7a00] text-[#ff7a00]"
                        : "border-[#2a3441] text-[#94a3b8]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Compare
                    </span>
                  </button>
                  <button
                    type="button"
                    className="rounded-[8px] border border-[#2a3441] px-4 py-3 text-[13px] font-semibold text-[#94a3b8]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Report
                    </span>
                  </button>
                </div>
                {error ? (
                  <div className="rounded-[10px] bg-[#2a1111] px-4 py-3 text-[14px] text-[#fca5a5]">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-6">
              <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#ff7a00]">
                Seller
              </div>
              <div className="mt-3 text-[26px] font-bold text-white">{seller?.displayName}</div>
              <div className="mt-2 text-[14px] leading-6 text-[#94a3b8]">{seller?.bio}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
                <div className="rounded-[10px] bg-[#101318] p-4 text-[#94a3b8]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
                    Country
                  </div>
                  <div className="mt-2 text-white">{seller?.country}</div>
                </div>
                <div className="rounded-[10px] bg-[#101318] p-4 text-[#94a3b8]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
                    Response
                  </div>
                  <div className="mt-2 text-white">{seller?.responseTime}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border border-[#2a3441] bg-[#1f262e] p-6">
              <h2 className="text-[22px] font-bold text-white">Terms & policy</h2>
              <div className="mt-4 space-y-4 text-[14px] leading-6 text-[#94a3b8]">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
                    Terms of use
                  </div>
                  <div className="mt-1">{product.termsOfUse}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
                    Refund policy
                  </div>
                  <div className="mt-1">{product.refundPolicy}</div>
                </div>
                <div className="rounded-[10px] bg-[#101318] p-4 text-[#94a3b8]">
                  <div className="inline-flex items-center gap-2 font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-[#ff7a00]" />
                    Buyer protection applies
                  </div>
                  <div className="mt-2 text-[13px] leading-6">
                    Moderation, dispute handling and seller follow-up stay inside the marketplace.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {similar.length > 0 ? (
          <section>
            <div className="mb-5">
              <h2 className="text-[24px] font-bold leading-8 text-white">Similar products</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              {similar.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
