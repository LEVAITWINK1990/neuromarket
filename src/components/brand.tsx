import { cn } from "@/lib/utils";

/**
 * NeuroMarket wordmark.
 * Orange-tinted "N" tile with two-tone wordmark.
 */
export function Brand({
  className,
  size = "md",
  invert = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  invert?: boolean;
}) {
  const sizeClass =
    size === "sm"
      ? "text-base"
      : size === "lg"
        ? "text-2xl md:text-[26px]"
        : "text-xl md:text-[22px]";
  const tileClass =
    size === "sm"
      ? "h-7 w-7 text-sm rounded-md"
      : size === "lg"
        ? "h-10 w-10 text-xl rounded-lg"
        : "h-9 w-9 text-base rounded-md";

  return (
    <span className={cn("inline-flex items-center gap-2 font-black tracking-tight", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center bg-primary font-black text-primary-foreground shadow-[0_0_18px_-4px_hsl(var(--primary)/0.7)]",
          tileClass,
        )}
        aria-hidden
      >
        N
      </span>
      <span className={cn("leading-none", sizeClass, invert ? "text-white" : "text-foreground")}>
        <span className="text-primary">neuro</span>
        <span>market</span>
      </span>
    </span>
  );
}
