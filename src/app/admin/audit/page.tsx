import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const dynamic = "force-dynamic";

export default async function AuditLog() {
  const t = await getTranslations("admin");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("audit_title")}</h1>
        <AdminNav current="/admin/audit" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("audit_count", { count: logs.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("audit_th_action")}</TableHead>
                <TableHead>{t("audit_th_actor")}</TableHead>
                <TableHead>{t("audit_th_subject")}</TableHead>
                <TableHead>{t("audit_th_metadata")}</TableHead>
                <TableHead>{t("audit_th_when")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-sm">
                    {l.action.replace(/_/g, " ").toLowerCase()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.actor?.name ?? t("system")}
                    {l.actor?.email && <div className="text-muted-foreground">{l.actor.email}</div>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.subject ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <code className="text-[10px] text-muted-foreground">
                      {l.metadata ? JSON.stringify(JSON.parse(l.metadata)).slice(0, 120) : "—"}
                    </code>
                  </TableCell>
                  <TableCell>{formatDate(l.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
