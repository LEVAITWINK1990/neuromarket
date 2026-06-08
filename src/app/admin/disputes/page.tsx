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
import { formatDate } from "@/lib/utils";
import { AdminNav } from "../_admin-nav";
import { DisputeActions } from "./actions";

export const dynamic = "force-dynamic";

type DisputeStatusKey =
  | "dispute_status_OPEN"
  | "dispute_status_AWAITING_SELLER"
  | "dispute_status_AWAITING_BUYER"
  | "dispute_status_UNDER_REVIEW"
  | "dispute_status_RESOLVED_REFUND_BUYER"
  | "dispute_status_RESOLVED_RELEASE_SELLER"
  | "dispute_status_RESOLVED_PARTIAL"
  | "dispute_status_REFUNDED_BUYER"
  | "dispute_status_RELEASED_TO_SELLER"
  | "dispute_status_REJECTED";

export default async function AdminDisputes() {
  const t = await getTranslations("admin");
  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: { include: { items: true } },
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true } },
    },
  });
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("disputes_title")}</h1>
        <AdminNav current="/admin/disputes" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("disputes_count", { count: disputes.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("disputes_empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("disputes_th_order")}</TableHead>
                  <TableHead>{t("disputes_th_buyer")}</TableHead>
                  <TableHead>{t("disputes_th_status")}</TableHead>
                  <TableHead>{t("disputes_th_opened")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/orders/${d.orderId}`} className="font-medium hover:underline">
                        {d.order.items[0]?.title ?? t("orders_fallback_title")}
                      </Link>
                      <div className="text-xs text-muted-foreground">{d.reason}</div>
                    </TableCell>
                    <TableCell className="text-xs">{d.buyer.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`dispute_status_${d.status}` as DisputeStatusKey)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(d.createdAt)}</TableCell>
                    <TableCell>
                      <DisputeActions disputeId={d.id} status={d.status} />
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
