import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { demoCategories } from "@/lib/demo-data";

export default function CategoriesPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
            Categories
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">Индекс AI-категорий</h1>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoCategories.map((category) => (
            <Link
              key={category.id}
              href={`/marketplace?category=${category.id}`}
              className="rounded-[28px] border border-white/10 bg-[#11161f] p-5 transition hover:border-[#f97316]/40"
            >
              <div className="h-2 w-16 rounded-full" style={{ backgroundColor: category.accent }} />
              <div className="mt-5 text-2xl font-black text-white">{category.label}</div>
              <div className="mt-2 text-sm text-white/55">{category.teaser}</div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
