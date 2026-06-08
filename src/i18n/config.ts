// next-intl "without i18n routing" config — locale is stored in a cookie,
// no URL prefix. Switching languages is done by setting the cookie and
// re-rendering the page. Keeps existing routes (/marketplace, /admin, …)
// untouched and avoids restructuring the entire app tree.

export const locales = ["ru", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
