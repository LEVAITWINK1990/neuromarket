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
import { ReportActions } from "./actions";

export const dynamic = "force-dynamic";

type ReportStatusKey =
  | "report_status_OPEN"
  | "report_status_UNDER_REVIEW"
  | "report_status_ACTION_TAKEN"
  | "report_status_RESOLVED"
  | "report_status_DISMISSED";

type ReportReasonKey =
  | "report_reason_UNAUTHORIZED_RESALE"
  | "report_reason_STOLEN_ACCOUNT"
  | "report_reason_FAKE_PRODUCT"
  | "report_reason_MISLEADING_DESCRIPTION"
  | "report_reason_ILLEGAL_CONTENT"
  | "report_reason_DUPLICATE_LISTING"
  | "report_reason_OTHER";

export default async function AdminReports() {
  const t = await getTranslations("admin");
  const reports = await prisma.productReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { include: { seller: true } },
      reporter: { select: { name: true } },
    },
    take: 100,
  });
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("reports_title")}</h1>
        <AdminNav current="/admin/reports" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("reports_count", { count: reports.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("reports_empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports_th_product")}</TableHead>
                  <TableHead>{t("reports_th_reason")}</TableHead>
                  <TableHead>{t("reports_th_reporter")}</TableHead>
                  <TableHead>{t("reports_th_status")}</TableHead>
                  <TableHead>{t("reports_th_opened")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={`/products/${r.product.slug}`}
                        className="hover:underline font-medium"
                      >
                        {r.product.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {t("reports_seller_label")} {r.product.seller.displayName}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {t(`report_reason_${r.reason}` as ReportReasonKey)}
                    </TableCell>
                    <TableCell className="text-xs">{r.reporter.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`report_status_${r.status}` as ReportStatusKey)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <ReportActions reportId={r.id} productId={r.productId} status={r.status} />
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
