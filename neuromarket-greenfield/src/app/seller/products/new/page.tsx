"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { demoCategories } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";

export default function SellerNewProductPage() {
  const router = useRouter();
  const { createSellerProduct, currentUser } = useDemoStore();
  const [title, setTitle] = useState("Custom AI Offer");
  const [shortDescription, setShortDescription] = useState(
    "Manual listing created from scratch in the greenfield app.",
  );
  const [price, setPrice] = useState("39.99");
  const [categoryId, setCategoryId] = useState("chatgpt");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createSellerProduct({
      slug: `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      title,
      shortDescription,
      description: shortDescription,
      price: Number(price),
      originalPrice: Number(price) * 1.25,
      rating: 0,
      ratingCount: 0,
      salesCount: 0,
      sellerId: currentUser?.sellerId ?? "seller-3",
      categoryId,
      productType: "MANUAL_DELIVERY",
      deliveryType: "MANUAL",
      verified: false,
      smart: false,
      coverage: "Global",
      validity: "Custom delivery window",
      refundPolicy: "Reviewed by seller and admin.",
      termsOfUse: "Legal usage only.",
      whatYouReceive: ["Custom manual delivery", "Seller follow-up", "Buyer protection"],
      faq: [
        {
          question: "Когда листинг появится?",
          answer: "После admin review в разделе Admin products.",
        },
      ],
      cover: { from: "#1f2937", via: "#f97316", to: "#facc15", glyph: "NEW", eyebrow: "PENDING" },
    });
    router.push("/seller/products");
  };

  return (
    <PageShell>
      <Guard title="Create listing" role="SELLER">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-[30px] border border-white/10 bg-[#11161f] p-6"
        >
          <h1 className="text-4xl font-black text-white">Новый листинг</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
            />
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
            />
          </div>
          <textarea
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            className="min-h-28 w-full rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none"
          >
            {demoCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <button className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black">
            Submit for review
          </button>
        </form>
      </Guard>
    </PageShell>
  );
}
