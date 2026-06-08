import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-black uppercase tracking-wide text-primary hover:underline"
        >
          {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
