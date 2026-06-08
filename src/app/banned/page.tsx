import { getTranslations } from "next-intl/server";

export default async function BannedPage() {
  const t = await getTranslations("banned");
  return (
    <div className="container max-w-md py-24 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("body")}</p>
    </div>
  );
}
