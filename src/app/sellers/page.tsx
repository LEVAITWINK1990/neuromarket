import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, BadgeCheck, Coins, BarChart3, Headset } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("sellers_info");
  return { title: t("page_title") };
}

export default async function SellersInfoPage() {
  const t = await getTranslations("sellers_info");
  return (
    <div className="container max-w-5xl py-16 space-y-12">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          <BadgeCheck className="h-3.5 w-3.5 mr-1" /> {t("badge")}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">{t("headline")}</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">{t("subhead")}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/sign-up?role=seller">
            <Button size="lg">{t("cta_become")}</Button>
          </Link>
          <Link href="/marketplace">
            <Button size="lg" variant="outline">
              {t("cta_see")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature
          icon={<Coins className="h-5 w-5 text-primary" />}
          title={t("feature_fees_title")}
          body={t("feature_fees_body")}
        />
        <Feature
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          title={t("feature_analytics_title")}
          body={t("feature_analytics_body")}
        />
        <Feature
          icon={<Headset className="h-5 w-5 text-primary" />}
          title={t("feature_disputes_title")}
          body={t("feature_disputes_body")}
        />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">{t("how_title")}</h2>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <Step n={1} title={t("step1_title")}>
            {t("step1_body")}
          </Step>
          <Step n={2} title={t("step2_title")}>
            {t("step2_body")}
          </Step>
          <Step n={3} title={t("step3_title")}>
            {t("step3_body")}
          </Step>
          <Step n={4} title={t("step4_title")}>
            {t("step4_body")}
          </Step>
        </ol>
      </section>

      <section className="rounded-xl border bg-muted/20 p-6 space-y-2">
        <h3 className="font-semibold">{t("not_accept_title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("not_accept_body")}{" "}
          <Link href="/trust-and-safety" className="text-primary hover:underline">
            {t("not_accept_link")}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-2">
        <div className="flex items-center gap-2 font-medium">
          {icon} {title}
        </div>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 items-start">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {n}
      </span>
      <div>
        <div className="font-medium text-foreground flex items-center gap-2">
          {title} <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        </div>
        <p>{children}</p>
      </div>
    </li>
  );
}
