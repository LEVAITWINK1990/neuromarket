import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { DemoProduct } from "@/lib/types";

export function HeroBanner({
  featured,
  thumbnails,
}: {
  featured: DemoProduct;
  thumbnails: DemoProduct[];
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10 p-6 lg:p-8"
        style={{
          backgroundImage: `linear-gradient(135deg, ${featured.cover.from}, ${featured.cover.via}, ${featured.cover.to})`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.35),transparent_35%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white">
              <ShieldCheck className="h-4 w-4 text-[#f97316]" />
              Featured Hero
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
                {featured.cover.eyebrow}
              </p>
              <h1 className="mt-3 max-w-xl text-4xl font-black text-white lg:text-5xl">
                {featured.title}
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/82">{featured.description}</p>
            </div>
            <div className="flex flex-wrap items-end gap-5">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/55">From</div>
                <div className="text-4xl font-black text-white">{formatMoney(featured.price)}</div>
              </div>
              <Link
                href={`/products/${featured.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
              >
                Купить сейчас
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex items-end justify-end">
            <div className="w-full max-w-sm rounded-[28px] border border-white/15 bg-black/20 p-5 shadow-2xl backdrop-blur">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                What you receive
              </div>
              <div className="mt-6 text-[104px] font-black leading-none text-white/85">
                {featured.cover.glyph}
              </div>
              <ul className="mt-6 space-y-3 text-sm text-white/82">
                {featured.whatYouReceive.map((item) => (
                  <li key={item} className="rounded-2xl bg-white/10 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {thumbnails.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="overflow-hidden rounded-[24px] border border-white/10 bg-[#11161f] p-4 transition hover:border-[#f97316]/50"
          >
            <div
              className="rounded-[20px] p-4"
              style={{
                backgroundImage: `linear-gradient(135deg, ${item.cover.from}, ${item.cover.via}, ${item.cover.to})`,
              }}
            >
              <div className="text-5xl font-black text-white/90">{item.cover.glyph}</div>
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                {item.cover.eyebrow}
              </div>
              <div className="mt-2 text-sm font-bold text-white">{item.title}</div>
              <div className="mt-1 text-sm text-[#f97316]">{formatMoney(item.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
