import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f16] text-white">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
