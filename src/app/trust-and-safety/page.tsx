import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, Scale, FileCheck, AlertTriangle } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("trust_safety");
  return { title: t("page_title") };
}

export default async function TrustAndSafetyPage() {
  const t = await getTranslations("trust_safety");
  return (
    <div className="container max-w-4xl py-16 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" /> {t("eyebrow")}
        </div>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-2xl">{t("intro")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" /> {t("allowed_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("allowed_1")}</li>
            <li>{t("allowed_2")}</li>
            <li>{t("allowed_3")}</li>
            <li>{t("allowed_4")}</li>
            <li>{t("allowed_5")}</li>
            <li>{t("allowed_6")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> {t("forbidden_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("forbidden_1")}</li>
            <li>{t("forbidden_2")}</li>
            <li>{t("forbidden_3")}</li>
            <li>{t("forbidden_4")}</li>
            <li>{t("forbidden_5")}</li>
            <li>{t("forbidden_6")}</li>
          </ul>
          <p className="pt-2">{t("forbidden_outro")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> {t("privacy_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("privacy_1")}</li>
            <li>{t("privacy_2")}</li>
            <li>{t("privacy_3")}</li>
            <li>{t("privacy_4")}</li>
            <li>{t("privacy_5")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" /> {t("disputes_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t("disputes_body")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
