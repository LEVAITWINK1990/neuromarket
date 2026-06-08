"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  /** Optional path to a cover image. When omitted, the slide uses a colored gradient placeholder. */
  cover?: string | null;
  /** Accessible label for the cover image / placeholder. */
  coverAlt: string;
  badge: string;
  title: string;
  subtitle?: string;
  href: string;
  cta: string;
  priceLabel?: string;
  /** Optional little discount chip (e.g. "-25%"). */
  discountLabel?: string;
}

export function HeroBanner({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = React.useState(0);
  const total = slides.length;
  const next = React.useCallback(() => setActive((i) => (i + 1) % total), [total]);
  const prev = React.useCallback(() => setActive((i) => (i - 1 + total) % total), [total]);

  React.useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
  }, [next, total]);

  if (total === 0) return null;
  const current = slides[active];

  return (
    <div className="space-y-3">
      {/* Big hero — softer, capped height */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-border md:h-[420px] lg:h-[460px]">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === active ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i !== active}
          >
            {s.cover ? (
              <>
                {/* Blurred ambient fill so the wide banner has no empty bars
                    while the real artwork keeps its natural proportions. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.cover}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
                />
                {/* Sharp cover anchored right, shown at its real aspect ratio
                    (h-full + w-auto) so it is never stretched or over-zoomed. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.cover}
                  alt={s.coverAlt}
                  className="absolute inset-y-0 right-0 h-full w-auto max-w-[55%] object-contain object-right"
                />
              </>
            ) : (
              <SlidePlaceholder seed={s.id} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content layer */}
        <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary-foreground">
                  {current.badge}
                </span>
                {current.discountLabel && (
                  <span className="rounded-full bg-[hsl(var(--discount))] px-3 py-1 text-[11px] font-black tracking-wide text-[hsl(var(--discount-foreground))]">
                    {current.discountLabel}
                  </span>
                )}
                <span className="hidden items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur sm:inline-flex">
                  <Zap className="h-3 w-3 text-primary" /> Instant delivery
                </span>
                <span className="hidden items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur md:inline-flex">
                  <ShieldCheck className="h-3 w-3 text-primary" /> Verified seller
                </span>
              </div>
              <h2 className="text-2xl font-black leading-[1.1] text-white drop-shadow-md md:text-4xl lg:text-5xl line-clamp-3">
                {current.title}
              </h2>
              {current.subtitle && (
                <p className="hidden max-w-xl text-sm text-white/80 md:block md:text-base">
                  {current.subtitle}
                </p>
              )}
              {current.priceLabel && (
                <p className="text-sm font-medium text-white/80">
                  from{" "}
                  <span className="text-2xl font-black text-white md:text-3xl">
                    {current.priceLabel}
                  </span>
                </p>
              )}
            </div>

            <Link
              href={current.href}
              className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-primary px-7 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/40 transition hover:bg-primary/90 md:h-14 md:px-9 md:text-base md:self-end"
            >
              {current.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/55 p-2.5 text-white backdrop-blur transition hover:bg-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/55 p-2.5 text-white backdrop-blur transition hover:bg-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4 md:grid-cols-8">
          {slides.map((s, i) => {
            const isActive = i === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Switch to ${s.coverAlt}`}
                className={cn(
                  "group relative aspect-[16/10] overflow-hidden rounded-xl border-2 transition-all",
                  isActive
                    ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.25),0_10px_22px_-10px_hsl(var(--primary)/0.55)]"
                    : "border-white/10 opacity-90 hover:opacity-100 hover:border-white/30",
                )}
              >
                {s.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.cover}
                    alt={s.coverAlt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <SlidePlaceholder seed={s.id} compact label={s.badge} />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:opacity-0" />
                )}
                {s.discountLabel && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-[hsl(var(--discount))] px-1.5 py-0.5 text-[9px] font-black leading-none text-white shadow">
                    {s.discountLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Coloured gradient placeholder used until real cover artwork is uploaded.
 * The colour is derived from the slide id so the same slide always looks the
 * same across renders.
 */
function SlidePlaceholder({
  seed,
  compact,
  label,
}: {
  seed: string;
  compact?: boolean;
  label?: string;
}) {
  const palette = [
    "from-primary/60 via-zinc-900 to-zinc-950",
    "from-rose-700/60 via-zinc-900 to-zinc-950",
    "from-amber-600/60 via-zinc-900 to-zinc-950",
    "from-violet-700/60 via-zinc-900 to-zinc-950",
    "from-sky-700/60 via-zinc-900 to-zinc-950",
    "from-emerald-700/60 via-zinc-900 to-zinc-950",
    "from-fuchsia-700/60 via-zinc-900 to-zinc-950",
    "from-teal-700/60 via-zinc-900 to-zinc-950",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cls = palette[h % palette.length];

  return (
    <div className={cn("absolute inset-0 bg-gradient-to-br", cls)}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      {compact && label && (
        <span className="absolute bottom-1.5 left-2 max-w-[80%] truncate rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white drop-shadow backdrop-blur">
          {label}
        </span>
      )}
    </div>
  );
}
