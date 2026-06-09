import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 lg:px-5 lg:py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
