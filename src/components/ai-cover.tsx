import {
  MessageSquare,
  Bot,
  Image as ImageIcon,
  Sparkles,
  Music2,
  Film,
  Code2,
  Search,
  Coins,
  Brain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AITool =
  | "chatgpt"
  | "claude"
  | "midjourney"
  | "gemini"
  | "suno"
  | "runway"
  | "cursor"
  | "perplexity"
  | "openai-credits"
  | "anthropic-credits";

interface ToolConfig {
  name: string;
  Icon: LucideIcon;
  /** Tailwind gradient classes — used for both the cover background and a subtle accent on the orb. */
  gradient: string;
  glowColor: string;
  short: string;
  /** Two-letter glyph rendered like a sticker on the cover. */
  glyph: string;
  /** Optional bottom-left tagline shown on the hero cover. */
  tagline: string;
}

export const AI_TOOLS: Record<AITool, ToolConfig> = {
  chatgpt: {
    name: "ChatGPT Plus",
    short: "ChatGPT",
    Icon: MessageSquare,
    gradient: "from-emerald-500 via-emerald-900 to-zinc-950",
    glowColor: "rgba(16,185,129,0.65)",
    glyph: "GPT",
    tagline: "AI Subscription",
  },
  claude: {
    name: "Claude Pro",
    short: "Claude",
    Icon: Bot,
    gradient: "from-orange-500 via-orange-900 to-zinc-950",
    glowColor: "rgba(249,115,22,0.65)",
    glyph: "CL",
    tagline: "Long-context AI",
  },
  midjourney: {
    name: "Midjourney",
    short: "Midjourney",
    Icon: ImageIcon,
    gradient: "from-violet-500 via-purple-900 to-zinc-950",
    glowColor: "rgba(139,92,246,0.65)",
    glyph: "MJ",
    tagline: "Image AI",
  },
  gemini: {
    name: "Gemini Advanced",
    short: "Gemini",
    Icon: Sparkles,
    gradient: "from-sky-500 via-blue-900 to-zinc-950",
    glowColor: "rgba(14,165,233,0.65)",
    glyph: "GE",
    tagline: "Google AI",
  },
  suno: {
    name: "Suno",
    short: "Suno",
    Icon: Music2,
    gradient: "from-fuchsia-500 via-fuchsia-900 to-zinc-950",
    glowColor: "rgba(217,70,239,0.65)",
    glyph: "SU",
    tagline: "Music AI",
  },
  runway: {
    name: "Runway",
    short: "Runway",
    Icon: Film,
    gradient: "from-rose-500 via-rose-900 to-zinc-950",
    glowColor: "rgba(244,63,94,0.65)",
    glyph: "RW",
    tagline: "Video AI",
  },
  cursor: {
    name: "Cursor Pro",
    short: "Cursor",
    Icon: Code2,
    gradient: "from-amber-500 via-amber-900 to-zinc-950",
    glowColor: "rgba(245,158,11,0.65)",
    glyph: "CR",
    tagline: "Dev IDE",
  },
  perplexity: {
    name: "Perplexity Pro",
    short: "Perplexity",
    Icon: Search,
    gradient: "from-teal-500 via-teal-900 to-zinc-950",
    glowColor: "rgba(20,184,166,0.65)",
    glyph: "PP",
    tagline: "AI search",
  },
  "openai-credits": {
    name: "OpenAI Credits",
    short: "OpenAI Credits",
    Icon: Coins,
    gradient: "from-primary via-orange-900 to-zinc-950",
    glowColor: "rgba(249,115,22,0.65)",
    glyph: "API",
    tagline: "API top-up",
  },
  "anthropic-credits": {
    name: "Anthropic Credits",
    short: "Anthropic",
    Icon: Brain,
    gradient: "from-rose-500 via-rose-900 to-zinc-950",
    glowColor: "rgba(244,63,94,0.6)",
    glyph: "AN",
    tagline: "API top-up",
  },
};

/**
 * A stylized AI-tool cover — composed of a gradient background, a glowing orb,
 * a soft "card-inside-card" plate with the icon and a glyph sticker. Used for
 * both the hero banner background and the small thumbnail strip.
 */
export function AICover({
  tool,
  size = "md",
  className,
  showLabel = false,
}: {
  tool: AITool;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}) {
  const cfg = AI_TOOLS[tool];
  const Icon = cfg.Icon;
  const isLg = size === "lg";

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br",
        cfg.gradient,
        className,
      )}
    >
      {/* Big glow blob to give the cover depth */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-full blur-3xl",
          isLg
            ? "right-[10%] top-1/2 h-[120%] w-[55%] -translate-y-1/2"
            : "right-[-30%] top-[-20%] h-[160%] w-[120%]",
        )}
        style={{ background: cfg.glowColor }}
      />

      {/* Decorative dot grid */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-20 mix-blend-screen"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`dotgrid-${tool}-${size}`}
            width={isLg ? "26" : "14"}
            height={isLg ? "26" : "14"}
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dotgrid-${tool}-${size})`} />
      </svg>

      {isLg ? (
        <>
          {/* Large hero composition: floating glass card with icon + glyph */}
          <div aria-hidden className="absolute right-[6%] top-1/2 hidden -translate-y-1/2 sm:block">
            {/* Back card */}
            <div
              className="absolute inset-0 -rotate-6 rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-md"
              style={{ width: "min(38vw, 360px)", height: "min(38vw, 360px)" }}
            />
            {/* Front card */}
            <div
              className="relative flex flex-col items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
              style={{ width: "min(38vw, 360px)", height: "min(38vw, 360px)" }}
            >
              <Icon className="h-28 w-28 text-white drop-shadow-[0_0_24px_rgba(0,0,0,0.55)] md:h-36 md:w-36 lg:h-40 lg:w-40" />
              <span className="mt-4 rounded-full bg-black/40 px-4 py-1 text-sm font-black tracking-[0.2em] text-white">
                {cfg.glyph}
              </span>
            </div>
          </div>
          {/* On small mobile show just the glowing icon */}
          <Icon
            aria-hidden
            className="absolute right-6 top-1/2 block h-24 w-24 -translate-y-1/2 text-white/95 drop-shadow-[0_0_30px_rgba(0,0,0,0.6)] sm:hidden"
          />
        </>
      ) : (
        // Compact thumbnail composition
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm shadow-md">
            <Icon className="h-6 w-6 text-white drop-shadow" />
          </div>
        </div>
      )}

      {/* Bottom-left tagline on hero only */}
      {isLg && (
        <span className="absolute bottom-3 left-3 hidden rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur md:inline-flex">
          {cfg.tagline}
        </span>
      )}

      {showLabel && !isLg && (
        <div className="absolute bottom-1.5 left-2 max-w-[80%] truncate rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white drop-shadow backdrop-blur">
          {cfg.short}
        </div>
      )}
    </div>
  );
}
