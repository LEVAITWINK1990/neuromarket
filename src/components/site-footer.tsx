import Link from "next/link";
import {
  CreditCard,
  Wallet,
  Bitcoin,
  Apple,
  Smartphone,
  Globe2,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Star,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Brand } from "@/components/brand";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/40">
      {/* Newsletter strip */}
      <div className="bg-primary/10 border-b border-border/60">
        <div className="container flex flex-col items-center gap-3 py-6 md:flex-row md:justify-between">
          <div>
            <h3 className="text-lg font-bold">{t("newsletter_title")}</h3>
            <p className="text-sm text-muted-foreground">{t("newsletter_body")}</p>
          </div>
          <form className="flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              placeholder={t("newsletter_placeholder")}
              className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("newsletter_submit")}
            </button>
          </form>
        </div>
      </div>

      <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Brand />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("tagline")}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">4.8</span>
              <span className="text-muted-foreground">/ 5.0</span>
            </span>
            <span className="text-xs text-muted-foreground">{t("trustpilot_label")}</span>
          </div>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <Link href="#" aria-label="Twitter" className="hover:text-foreground">
              <Twitter className="h-4 w-4" />
            </Link>
            <Link href="#" aria-label="Facebook" className="hover:text-foreground">
              <Facebook className="h-4 w-4" />
            </Link>
            <Link href="#" aria-label="Instagram" className="hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </Link>
            <Link href="#" aria-label="YouTube" className="hover:text-foreground">
              <Youtube className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <FooterColumn
          title={t("section_marketplace")}
          links={[
            { href: "/marketplace", label: t("browse_all") },
            { href: "/categories", label: t("categories") },
            { href: "/marketplace?verified=1", label: t("verified_sellers") },
            { href: "/marketplace?sort=newest", label: t("new_arrivals") },
            { href: "/smart", label: t("smart") },
          ]}
        />

        <FooterColumn
          title={t("section_sellers")}
          links={[
            { href: "/sellers", label: t("become_a_seller") },
            { href: "/sellers#fees", label: t("fees") },
            { href: "/sellers#rules", label: t("rules") },
            { href: "/affiliate", label: t("affiliate") },
          ]}
        />

        <FooterColumn
          title={t("section_help")}
          links={[
            { href: "/trust-and-safety", label: t("trust_and_safety") },
            { href: "/trust-and-safety#refunds", label: t("refunds") },
            { href: "/trust-and-safety#prohibited", label: t("prohibited") },
            { href: "/faq", label: t("faq") },
            { href: "/support", label: t("support") },
          ]}
        />
      </div>

      {/* Payment / certification strip */}
      <div className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-xs text-muted-foreground md:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold uppercase tracking-wide text-foreground">
              {t("we_accept")}
            </span>
            <PaymentChip icon={CreditCard} label="Visa / Mastercard" />
            <PaymentChip icon={Wallet} label="PayPal" />
            <PaymentChip icon={Apple} label="Apple Pay" />
            <PaymentChip icon={Smartphone} label="Google Pay" />
            <PaymentChip icon={Bitcoin} label="Crypto" />
            <PaymentChip icon={Globe2} label="YooKassa" />
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground md:flex-row">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("disclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link className="hover:text-foreground" href={l.href}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-foreground">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </span>
  );
}
