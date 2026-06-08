import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { AdminNav } from "../_admin-nav";

export const dynamic = "force-dynamic";

type OrderStatusKey =
  | "order_status_PENDING_PAYMENT"
  | "order_status_PAID"
  | "order_status_DELIVERED"
  | "order_status_COMPLETED"
  | "order_status_DISPUTED"
  | "order_status_REFUNDED"
  | "order_status_CANCELLED";

export default async function AdminOrders() {
  const t = await getTranslations("admin");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, buyer: { select: { name: true, email: true } } },
    take: 100,
  });
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("orders_title")}</h1>
        <AdminNav current="/admin/orders" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("orders_count", { count: orders.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orders_th_order")}</TableHead>
                <TableHead>{t("orders_th_buyer")}</TableHead>
                <TableHead>{t("orders_th_status")}</TableHead>
                <TableHead>{t("orders_th_total")}</TableHead>
                <TableHead>{t("orders_th_created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                      {o.items[0]?.title ?? t("orders_fallback_title")}
                    </Link>
                    <div className="text-xs text-muted-foreground">#{o.id.slice(-8)}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {o.buyer.name}
                    <div className="text-muted-foreground">{o.buyer.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`order_status_${o.status}` as OrderStatusKey)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(o.totalCents, o.currency)}</TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
