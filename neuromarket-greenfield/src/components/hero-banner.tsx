"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { DemoProduct } from "@/lib/types";

export function HeroBanner({ slides }: { slides: DemoProduct[] }) {
  const [index, setIndex] = useState(0);
  const activeSlide = slides[index] ?? slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (index > slides.length - 1) {
      setIndex(0);
    }
  }, [index, slides.length]);

  const thumbSlides = useMemo(() => slides.slice(0, 6), [slides]);

  return (
    <section className="mb-12">
      <div className="relative mb-3">
        <div className="absolute right-[-6px] top-[6px] z-10 grid h-10 w-10 place-items-center rounded-[8px] bg-[#00dd80] text-[21px] font-black text-[#101318] shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
          S
        </div>

        <div className="relative overflow-hidden rounded-[12px]">
          <div className="relative aspect-[16/5.4] min-h-[280px] bg-[#1f262e]">
            {slides.map((slide, slideIndex) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  slideIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <img
                  src={slide.media.hero}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,19,24,0.82)_0%,rgba(16,19,24,0.35)_38%,rgba(16,19,24,0)_68%)]" />
                <div className="absolute bottom-10 left-10 z-[2]">
                  <div className="mb-2 inline-flex rounded-[4px] bg-black/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                    {slide.cover.eyebrow}
                  </div>
                  <h1 className="max-w-[14ch] text-[32px] font-bold leading-10 text-white">
                    {slide.title}
                  </h1>
                  <div className="mt-1 text-[19px] font-bold text-white">
                    from <span>{formatMoney(slide.price)}</span>
                  </div>
                </div>
                <Link
                  href={`/products/${slide.slug}`}
                  className="absolute bottom-10 right-10 z-[3] inline-flex h-[46px] items-center rounded-[8px] bg-[#ff7a00] px-[30px] text-[14px] font-bold uppercase tracking-[0.02em] text-white transition hover:bg-[#e66e00]"
                >
                  Buy now
                </Link>
              </div>
            ))}

            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setIndex((current) => (current - 1 + slides.length) % slides.length)
                  }
                  className="absolute left-[18px] top-1/2 z-[4] grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[rgba(245,245,245,0.88)] text-[#101318] transition hover:scale-105 hover:bg-white"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((current) => (current + 1) % slides.length)}
                  className="absolute right-[18px] top-1/2 z-[4] grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[rgba(245,245,245,0.88)] text-[#101318] transition hover:scale-105 hover:bg-white"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-[14px] md:grid-cols-3 xl:grid-cols-6">
        {thumbSlides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setIndex(slideIndex)}
            className={`relative overflow-hidden rounded-[12px] border-2 bg-[#1f262e] transition ${
              slideIndex === index ? "border-white" : "border-transparent"
            }`}
          >
            <div className="aspect-[16/10]">
              <img
                src={slide.media.hero}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div
              className={`absolute inset-0 transition ${
                slideIndex === index ? "bg-transparent" : "bg-[rgba(16,19,24,0.35)]"
              }`}
            />
          </button>
        ))}
      </div>
      {activeSlide ? <span className="sr-only">{activeSlide.title}</span> : null}
    </section>
  );
}
