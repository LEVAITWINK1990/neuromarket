import { PageShell } from "@/components/page-shell";

export default function BannedPage() {
  return (
    <PageShell>
      <div className="rounded-[30px] border border-white/10 bg-[#11161f] p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ef4444]">
          Account state
        </p>
        <h1 className="mt-3 text-4xl font-black text-white">Аккаунт заблокирован</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Доступ ограничен из-за нарушения trust & safety policy или активного расследования.
        </p>
      </div>
    </PageShell>
  );
}
