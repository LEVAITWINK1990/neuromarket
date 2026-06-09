import Link from "next/link";

import { PageShell } from "@/components/page-shell";

export default function SignUpPage() {
  return (
    <PageShell>
      <div className="rounded-[32px] border border-white/10 bg-[#11161f] p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">Sign up</p>
        <h1 className="mt-3 text-4xl font-black text-white">
          Greenfield demo работает через готовые роли.
        </h1>
        <p className="mt-4 max-w-2xl text-white/60">
          Чтобы быстрее проверить buyer, seller и admin потоки, используй seeded demo accounts на
          странице входа.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
        >
          Перейти ко входу
        </Link>
      </div>
    </PageShell>
  );
}
