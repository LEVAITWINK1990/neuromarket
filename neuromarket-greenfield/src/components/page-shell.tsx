import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#101318] text-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1320px] px-5 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
