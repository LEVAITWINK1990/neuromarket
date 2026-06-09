"use client";

import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { useDemoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/format";

export default function ComparePage() {
  const { allProducts, compare } = useDemoStore();
  const compared = allProducts.filter((product) => compare.includes(product.id));

  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">Compare</p>
          <h1 className="mt-3 text-4xl font-black text-white">Сравнение до 3 товаров</h1>
          <p className="mt-3 text-sm text-white/60">
            Собери shortlist и посмотри цену, delivery model, seller и рейтинг бок о бок.
          </p>
        </section>

        {compared.length > 0 ? (
          <div className="overflow-x-auto rounded-[30px] border border-white/10 bg-[#11161f]">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-white/45">
                <tr>
                  <th className="px-6 py-4">Field</th>
                  {compared.map((product) => (
                    <th key={product.id} className="px-6 py-4 text-white">
                      {product.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-white/75">
                {[
                  ["Price", compared.map((product) => formatMoney(product.price))],
                  ["Delivery", compared.map((product) => product.deliveryType)],
                  ["Type", compared.map((product) => product.productType)],
                  ["Rating", compared.map((product) => product.rating.toFixed(1))],
                  ["Coverage", compared.map((product) => product.coverage)],
                  ["Validity", compared.map((product) => product.validity)],
                ].map(([label, values]) => (
                  <tr key={label as string} className="border-b border-white/5">
                    <td className="px-6 py-4 font-bold text-white">{label as string}</td>
                    {(values as string[]).map((value, index) => (
                      <td key={`${label}-${index}`} className="px-6 py-4">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-[#11161f] p-10 text-center text-white/55">
            Пока нет выбранных товаров. Добавь позиции из каталога или product page.
          </div>
        )}

        <Link
          href="/marketplace"
          className="inline-flex rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
        >
          Вернуться в каталог
        </Link>
      </div>
    </PageShell>
  );
}
