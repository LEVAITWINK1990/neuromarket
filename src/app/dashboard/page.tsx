import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { RoleNav } from "@/components/role-nav";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const dynamic = "force-dynamic";

export default async function BuyerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/dashboard");

  const t = await getTranslations("dashboard");
  const NAV = [
    { href: "/dashboard", label: t("nav_overview") },
    { href: "/dashboard/orders", label: t("nav_orders") },
    { href: "/dashboard/wishlist", label: t("nav_wishlist") },
    { href: "/dashboard/disputes", label: t("nav_disputes") },
  ];

  const [orders, wishlist, disputes] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true, payment: true },
    }),
    prisma.wishlistItem.count({ where: { userId: session.user.id } }),
    prisma.dispute.count({ where: { buyerId: session.user.id } }),
  ]);

  const totalSpent = await prisma.order.aggregate({
    where: {
      buyerId: session.user.id,
      status: { in: ["PAID", "DELIVERED", "COMPLETED"] },
    },
    _sum: { totalCents: true },
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {t("welcome", { name: session.user.name ?? "" })}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <RoleNav items={NAV} current="/dashboard" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={t("stat_orders")}
          value={orders.length.toString()}
          sub={t("stat_orders_sub")}
        />
        <StatCard
          title={t("stat_total_spent")}
          value={formatPrice(totalSpent._sum.totalCents ?? 0)}
          sub={t("stat_total_spent_sub")}
        />
        <StatCard
          title={t("stat_wishlist")}
          value={wishlist.toString()}
          sub={t("stat_wishlist_sub")}
        />
        <StatCard
          title={t("stat_disputes")}
          value={disputes.toString()}
          sub={t("stat_disputes_sub")}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("recent_orders")}</CardTitle>
            <Link href="/dashboard/orders" className="text-sm text-primary hover:underline">
              {t("view_all")}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("no_orders")}{" "}
              <Link href="/marketplace" className="text-primary hover:underline">
                {t("browse_marketplace")}
              </Link>
              .
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_order")}</TableHead>
                  <TableHead>{t("col_status")}</TableHead>
                  <TableHead>{t("col_total")}</TableHead>
                  <TableHead>{t("col_created")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.items[0]?.title ?? t("col_fallback")}</div>
                      <div className="text-xs text-muted-foreground">#{o.id.slice(-8)}</div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>{formatPrice(o.totalCents, o.currency)}</TableCell>
                    <TableCell>{formatDate(o.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/orders/${o.id}`}>
                        <Button size="sm" variant="outline">
                          {t("view")}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
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
