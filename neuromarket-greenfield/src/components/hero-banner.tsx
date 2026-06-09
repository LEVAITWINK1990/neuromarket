import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <section className="space-y-4">
      <div className="relative overflow-hidden rounded-[18px] bg-[#232323]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(118deg, rgba(15,15,15,0.96) 0%, rgba(15,15,15,0.82) 44%, rgba(15,15,15,0.16) 100%), linear-gradient(130deg, ${featured.cover.from}, ${featured.cover.via}, ${featured.cover.to})`,
          }}
        />
        <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_58%)] lg:block" />
        <div className="relative grid min-h-[250px] items-stretch gap-8 px-6 py-7 sm:min-h-[320px] lg:grid-cols-[0.7fr_0.3fr] lg:px-10 lg:py-9 xl:aspect-[1400/470] xl:min-h-0">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ff8a3d]">
              {featured.cover.eyebrow}
            </p>
            <h1 className="mt-3 max-w-[18ch] text-[34px] font-black leading-[0.98] text-white lg:text-[54px]">
              {featured.title}
            </h1>
            <p className="mt-4 max-w-[56ch] text-sm font-medium leading-6 text-white/82 lg:text-[15px]">
              {featured.description}
            </p>
            <div className="mt-7 flex flex-wrap items-end gap-6">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/56">
                  from
                </div>
                <div className="mt-1 text-[38px] font-black leading-none text-white">
                  {formatMoney(featured.price)}
                </div>
              </div>
              <Link
                href={`/products/${featured.slug}`}
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#ff6a00] px-6 text-[13px] font-black uppercase tracking-[0.08em] text-white"
              >
                Buy now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="hidden items-end justify-end lg:flex">
            <div className="flex h-full w-full max-w-[320px] items-end justify-end">
              <div className="relative flex aspect-[313/378] w-[82%] flex-col justify-between overflow-hidden rounded-[18px] bg-[#161616]/60 p-5 backdrop-blur">
                <span className="inline-flex w-fit rounded-[10px] bg-[#ff6a00] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white">
                  Smart
                </span>
                <div className="text-right">
                  <div className="text-[120px] font-black leading-none text-white/88">
                    {featured.cover.glyph}
                  </div>
                  <div className="ml-auto mt-3 max-w-[13rem] space-y-2 text-left text-sm font-bold text-white/82">
                    {featured.whatYouReceive.slice(0, 3).map((item) => (
                      <div key={item} className="rounded-[12px] bg-white/8 px-4 py-3">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {thumbnails.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="overflow-hidden rounded-[14px] bg-[#232323] transition hover:bg-[#2a2a2a]"
          >
            <div
              className="aspect-[10/7] p-4"
              style={{
                backgroundImage: `linear-gradient(135deg, ${item.cover.from}, ${item.cover.via}, ${item.cover.to})`,
              }}
            >
              <div className="flex h-full items-end justify-between">
                <div className="text-5xl font-black text-white/92">{item.cover.glyph}</div>
                <span className="rounded-full bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                  {item.cover.eyebrow}
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="line-clamp-2 text-[13px] font-bold leading-5 text-white">
                {item.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
