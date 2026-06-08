import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "./sign-up-form";

export async function generateMetadata() {
  const t = await getTranslations("sign_up");
  return { title: `${t("page_title")} — NeuroMarket` };
}

export default async function SignUpPage() {
  const t = await getTranslations("sign_up");
  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>{t("page_title")}</CardTitle>
          <CardDescription>{t("page_subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}
