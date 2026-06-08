import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { AdminNav } from "../_admin-nav";
import { ProductModerationActions } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"] as const;

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const t = await getTranslations("admin");
  const where = searchParams.status
    ? {
        status: searchParams.status as
          | "PENDING_REVIEW"
          | "PUBLISHED"
          | "REJECTED"
          | "SUSPENDED"
          | "DRAFT",
      }
    : {};
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { seller: true, category: true, _count: { select: { reports: true } } },
    take: 100,
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("products_title")}</h1>
        <AdminNav current="/admin/products" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild>
          <Link href="/admin/products/new">{t("products_add")}</Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/products?status=${s}` : "/admin/products"}
            className={`rounded-md border px-3 py-1.5 ${
              (searchParams.status ?? "") === s
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {s
              ? t(`product_status_${s}` as "product_status_PENDING_REVIEW")
              : t("products_status_all")}
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("products_count_card", { count: products.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("products_th_product")}</TableHead>
                <TableHead>{t("products_th_seller")}</TableHead>
                <TableHead>{t("products_th_status")}</TableHead>
                <TableHead>{t("products_th_risk")}</TableHead>
                <TableHead>{t("products_th_reports")}</TableHead>
                <TableHead>{t("products_th_price")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/products/${p.slug}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {p.shortDescription}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.seller.displayName}
                    <div className="text-muted-foreground">
                      {t(
                        `verification_status_${p.seller.verificationStatus}` as
                          | "verification_status_PENDING"
                          | "verification_status_APPROVED"
                          | "verification_status_REJECTED"
                          | "verification_status_NOT_REQUESTED",
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(
                        `product_status_${p.status}` as
                          | "product_status_DRAFT"
                          | "product_status_PENDING_REVIEW"
                          | "product_status_PUBLISHED"
                          | "product_status_REJECTED"
                          | "product_status_SUSPENDED",
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.riskScore >= 50
                          ? "destructive"
                          : p.riskScore >= 25
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {Math.round(p.riskScore)}
                    </Badge>
                  </TableCell>
                  <TableCell>{p._count.reports}</TableCell>
                  <TableCell>{formatPrice(p.priceCents)}</TableCell>
                  <TableCell>
                    <ProductModerationActions productId={p.id} status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
