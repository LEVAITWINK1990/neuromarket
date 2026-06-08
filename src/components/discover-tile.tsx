import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiscoverTile({
  title,
  body,
  bullets,
  href,
  cta,
  accent = "primary",
}: {
  title: string;
  body: string;
  bullets: string[];
  href: string;
  cta: string;
  accent?: "primary" | "smart" | "accent";
}) {
  const accentClass =
    accent === "smart"
      ? "border-primary/40 from-primary/10"
      : accent === "accent"
        ? "border-accent/40 from-accent/10"
        : "border-primary/30 from-primary/5";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-gradient-to-br to-card via-card p-6",
        accentClass,
      )}
    >
      <h3 className="text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-black uppercase tracking-wide text-primary hover:underline"
      >
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
