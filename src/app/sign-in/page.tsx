import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { enabledOAuthProviders } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata() {
  const t = await getTranslations("sign_in");
  return { title: `${t("page_title")} — NeuroMarket` };
}

export default async function SignInPage() {
  const t = await getTranslations("sign_in");
  const providers = enabledOAuthProviders();
  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>{t("page_title")}</CardTitle>
          <CardDescription>{t("page_subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm providers={providers} />
          <p className="mt-6 text-sm text-muted-foreground">
            {t("no_account")}{" "}
            <Link className="text-primary hover:underline" href="/sign-up">
              {t("create_one")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
