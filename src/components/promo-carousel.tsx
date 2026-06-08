"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PromoSlide {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  cta: string;
  priceLabel?: string;
  /** Tailwind gradient classes for the background tint, e.g. `from-primary/40`. */
  gradient?: string;
  /** Optional image url; if omitted a stylized fallback is used. */
  image?: string | null;
  badge?: string;
}

export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const [active, setActive] = React.useState(0);
  const total = slides.length;
  const next = React.useCallback(() => setActive((i) => (i + 1) % total), [total]);
  const prev = React.useCallback(() => setActive((i) => (i - 1 + total) % total), [total]);

  React.useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, total]);

  if (total === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-sm border border-border">
      <div
        className="flex transition-transform duration-500"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((s) => (
          <article
            key={s.id}
            className={cn(
              "relative flex h-[340px] w-full shrink-0 items-end overflow-hidden bg-gradient-to-br md:h-[460px]",
              s.gradient ?? "from-primary/40 via-card to-background",
            )}
          >
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {/* Strong dark gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="relative z-10 max-w-2xl space-y-4 p-6 pb-10 md:p-12 md:pb-14">
              {s.badge && (
                <span className="inline-block rounded-sm bg-primary px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-primary-foreground">
                  {s.badge}
                </span>
              )}
              <h3 className="text-3xl font-black leading-[1.05] text-white md:text-5xl">
                {s.title}
              </h3>
              {s.subtitle && (
                <p className="max-w-xl text-sm text-white/85 md:text-base">{s.subtitle}</p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href={s.href}
                  className="inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-7 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
                >
                  {s.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {s.priceLabel && (
                  <span className="text-sm font-semibold text-white/90">{s.priceLabel}</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === active ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/70",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
