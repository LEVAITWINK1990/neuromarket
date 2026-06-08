import Link from "next/link";
import {
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Code2,
  Search,
  Bot,
  Palette,
  Film,
  Cpu,
  GraduationCap,
  Wand2,
  Github,
} from "lucide-react";

export const PLATFORMS = [
  { name: "ChatGPT", slug: "chatgpt", Icon: MessageSquare },
  { name: "Claude", slug: "claude", Icon: Bot },
  { name: "Midjourney", slug: "midjourney", Icon: ImageIcon },
  { name: "Gemini", slug: "gemini", Icon: Sparkles },
  { name: "Grok", slug: "grok", Icon: Wand2 },
  { name: "Perplexity", slug: "perplexity", Icon: Search },
  { name: "Cursor", slug: "cursor", Icon: Code2 },
  { name: "Copilot", slug: "microsoft-copilot", Icon: Github },
  { name: "Canva", slug: "canva", Icon: Palette },
  { name: "CapCut", slug: "capcut", Icon: Film },
  { name: "Syntx AI", slug: "syntx-ai", Icon: Cpu },
  { name: "AI Academy", slug: "ai-academy", Icon: GraduationCap },
] as const;

export function PlatformStrip() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {PLATFORMS.map((p) => (
        <Link
          key={p.slug}
          href={`/marketplace?platform=${p.slug}`}
          className="group relative flex h-16 items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-card text-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary"
        >
          <p.Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
          <span className="text-sm font-bold">{p.name}</span>
        </Link>
      ))}
    </div>
  );
}
