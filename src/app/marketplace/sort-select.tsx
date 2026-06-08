"use client";

import { useTranslations } from "next-intl";

interface SortSelectProps {
  defaultValue?: string;
  hiddenParams: Record<string, string>;
}

export function SortSelect({ defaultValue = "popular", hiddenParams }: SortSelectProps) {
  const t = useTranslations("marketplace");
  return (
    <form>
      {Object.entries(hiddenParams).map(([k, v]) =>
        !v ? null : <input key={k} type="hidden" name={k} value={v} />,
      )}
      <select
        name="sort"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
        aria-label={t("sort")}
      >
        <option value="popular">{t("sort_popular")}</option>
        <option value="newest">{t("sort_newest")}</option>
        <option value="rating">{t("sort_rating")}</option>
        <option value="price_asc">{t("sort_price_asc")}</option>
        <option value="price_desc">{t("sort_price_desc")}</option>
      </select>
    </form>
  );
}
