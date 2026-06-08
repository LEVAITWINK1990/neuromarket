import Link from "next/link";
import { cn } from "@/lib/utils";

interface Item {
  href: string;
  label: string;
}

export function RoleNav({ items, current }: { items: Item[]; current: string }) {
  return (
    <nav className="flex flex-wrap gap-1 rounded-md border bg-card p-1 text-sm">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors hover:bg-accent",
            current === it.href && "bg-primary text-primary-foreground hover:bg-primary",
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
