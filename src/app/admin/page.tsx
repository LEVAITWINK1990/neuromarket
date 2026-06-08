import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { AdminNav } from "./_admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const t = await getTranslations("admin");
  const [
    users,
    sellers,
    activeBuyers,
    products,
    pending,
    orders,
    grossOrders,
    refunds,
    disputes,
    commissions,
    topCategories,
    topSellers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "DELIVERED", "COMPLETED"] } },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { status: "REFUNDED" } }),
    prisma.dispute.count(),
    prisma.commissionRecord.aggregate({ _sum: { feeCents: true } }),
    prisma.category.findMany({
      orderBy: { products: { _count: "desc" } },
      take: 5,
      include: { _count: { select: { products: true } } },
    }),
    prisma.sellerProfile.findMany({
      orderBy: { ratingCount: "desc" },
      take: 5,
    }),
  ]);

  const gmv = grossOrders._sum.totalCents ?? 0;
  const platformRevenue = commissions._sum.feeCents ?? 0;
  const refundRate = orders === 0 ? 0 : (refunds / orders) * 100;
  const disputeRate = orders === 0 ? 0 : (disputes / orders) * 100;

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("overview_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("overview_subtitle")}</p>
        </div>
        <AdminNav current="/admin" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          title={t("stat_gmv")}
          value={formatPrice(gmv)}
          sub={t("stat_gmv_sub", { count: orders })}
        />
        <Stat
          title={t("stat_revenue")}
          value={formatPrice(platformRevenue)}
          sub={t("stat_revenue_sub")}
        />
        <Stat
          title={t("stat_sellers")}
          value={sellers.toString()}
          sub={t("stat_sellers_sub", { count: users })}
        />
        <Stat
          title={t("stat_buyers")}
          value={activeBuyers.toString()}
          sub={t("stat_buyers_sub", { count: products })}
        />
        <Stat title={t("stat_pending")} value={pending.toString()} sub={t("stat_pending_sub")} />
        <Stat
          title={t("stat_refund_rate")}
          value={`${refundRate.toFixed(1)}%`}
          sub={t("stat_refund_rate_sub", { count: refunds })}
        />
        <Stat
          title={t("stat_dispute_rate")}
          value={`${disputeRate.toFixed(1)}%`}
          sub={t("stat_dispute_rate_sub", { count: disputes })}
        />
        <Stat
          title={t("stat_commission")}
          value={formatPrice(platformRevenue)}
          sub={t("stat_commission_sub")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("top_categories")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {topCategories.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">
                    {t("products_count", { count: c._count.products })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("top_sellers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {topSellers.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.displayName}</span>
                  <span className="text-muted-foreground">
                    {s.rating.toFixed(1)}★ · {t("reviews_count", { count: s.ratingCount })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-xs uppercase text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
