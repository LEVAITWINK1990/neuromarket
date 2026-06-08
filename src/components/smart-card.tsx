import Link from "next/link";
import { Sparkles, Headphones, ShieldCheck, Tag, ArrowRight } from "lucide-react";

export function SmartCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-background p-6 md:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary-foreground">
              SMART
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              VIP-подписка
            </span>
          </div>
          <h3 className="text-3xl font-black leading-tight md:text-4xl">
            Экономьте <span className="text-primary">дополнительные 20%</span> каждый день
          </h3>
          <p className="text-sm text-muted-foreground md:text-base">
            Ежедневные промокоды, приоритетный чат 24/7, бесплатная защита покупателя и приоритет на
            предзаказы. Всего $0.99 за первый месяц, отмена в любой момент.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/80">
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Промокоды −20% ежедневно
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Бесплатная защита покупателя
            </span>
            <span className="inline-flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              Приоритетный чат 24/7
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Приоритет на предзаказы
            </span>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <Link
            href="/smart"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
          >
            Подключить SMART
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-center text-xs text-muted-foreground md:text-right">
            Затем $1.99 / месяц
          </span>
        </div>
      </div>
    </div>
  );
}
