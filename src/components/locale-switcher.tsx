import { getLocale, getTranslations } from "next-intl/server";
import { Languages } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
};

export async function LocaleSwitcher() {
  const current = (await getLocale()) as Locale;
  const t = await getTranslations("locale_switcher");

  return (
    <form
      action={setLocale}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-0.5 text-xs"
      aria-label={t("label")}
    >
      <Languages className="mx-1 h-3.5 w-3.5 text-white/60" aria-hidden />
      {locales.map((loc) => {
        const active = loc === current;
        return (
          <button
            key={loc}
            type="submit"
            name="locale"
            value={loc}
            aria-pressed={active}
            className={
              active
                ? "rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground shadow-sm"
                : "rounded-full px-2 py-0.5 text-white/70 hover:text-white"
            }
          >
            {LABELS[loc]}
          </button>
        );
      })}
    </form>
  );
}
