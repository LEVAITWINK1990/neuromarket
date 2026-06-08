import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

function pickFromAcceptLanguage(accept: string | null): Locale | null {
  if (!accept) return null;
  // very small parser: take the first tag and look at its primary subtag
  for (const part of accept.split(",")) {
    const tag = part.trim().split(";")[0]?.toLowerCase();
    if (!tag) continue;
    const primary = tag.split("-")[0];
    if (primary === "ru" || primary === "en") return primary;
  }
  return null;
}

export async function resolveLocale(): Promise<Locale> {
  const cookieJar = await cookies();
  const fromCookie = cookieJar.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerJar = await headers();
  const fromHeader = pickFromAcceptLanguage(headerJar.get("accept-language"));
  if (fromHeader) return fromHeader;

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
