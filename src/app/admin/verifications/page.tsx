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
import { VerificationActions } from "./actions";

export const dynamic = "force-dynamic";

type VerificationStatusKey =
  | "verification_status_PENDING"
  | "verification_status_APPROVED"
  | "verification_status_REJECTED"
  | "verification_status_NOT_REQUESTED";

export default async function AdminVerifications() {
  const t = await getTranslations("admin");
  const requests = await prisma.sellerVerificationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { seller: { include: { user: true } } },
  });
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("verifications_title")}</h1>
        <AdminNav current="/admin/verifications" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("verifications_count", { count: requests.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("verifications_th_seller")}</TableHead>
                <TableHead>{t("verifications_th_country")}</TableHead>
                <TableHead>{t("verifications_th_website")}</TableHead>
                <TableHead>{t("verifications_th_status")}</TableHead>
                <TableHead>{t("verifications_th_created")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.fullName}</div>
                    <div className="text-xs text-muted-foreground">{r.seller.user.email}</div>
                  </TableCell>
                  <TableCell>{r.country}</TableCell>
                  <TableCell className="text-xs">
                    {r.websiteUrl ? (
                      <a
                        className="text-primary hover:underline"
                        href={r.websiteUrl}
                        target="_blank"
                      >
                        {t("verifications_link")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`verification_status_${r.status}` as VerificationStatusKey)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(r.createdAt)}</TableCell>
                  <TableCell>
                    <VerificationActions requestId={r.id} sellerId={r.sellerId} status={r.status} />
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
