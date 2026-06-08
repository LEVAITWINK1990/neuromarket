import { getTranslations } from "next-intl/server";
import { RoleNav } from "@/components/role-nav";

export async function AdminNav({ current }: { current: string }) {
  const t = await getTranslations("admin");
  const items = [
    { href: "/admin", label: t("nav_overview") },
    { href: "/admin/users", label: t("nav_users") },
    { href: "/admin/products", label: t("nav_products") },
    { href: "/admin/orders", label: t("nav_orders") },
    { href: "/admin/disputes", label: t("nav_disputes") },
    { href: "/admin/reports", label: t("nav_reports") },
    { href: "/admin/verifications", label: t("nav_verifications") },
    { href: "/admin/payouts", label: t("nav_payouts") },
    { href: "/admin/messages", label: t("nav_messages") },
    { href: "/admin/audit", label: t("nav_audit") },
  ];
  return <RoleNav items={items} current={current} />;
}
