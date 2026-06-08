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
import { BanButton } from "./actions";

export const dynamic = "force-dynamic";

type UserRoleKey = "user_role_BUYER" | "user_role_SELLER" | "user_role_ADMIN";

type VerificationStatusKey =
  | "verification_status_PENDING"
  | "verification_status_APPROVED"
  | "verification_status_REJECTED"
  | "verification_status_NOT_REQUESTED";

export default async function AdminUsers() {
  const t = await getTranslations("admin");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { sellerProfile: true },
  });
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("users_title")}</h1>
        <AdminNav current="/admin/users" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("users_count", { count: users.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users_th_user")}</TableHead>
                <TableHead>{t("users_th_role")}</TableHead>
                <TableHead>{t("users_th_joined")}</TableHead>
                <TableHead>{t("users_th_seller")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                    {u.isBanned && <Badge variant="destructive">{t("users_banned")}</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t(`user_role_${u.role}` as UserRoleKey)}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    {u.sellerProfile ? (
                      <Badge
                        variant={
                          u.sellerProfile.verificationStatus === "APPROVED" ? "success" : "warning"
                        }
                      >
                        {t(
                          `verification_status_${u.sellerProfile.verificationStatus}` as VerificationStatusKey,
                        )}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {u.role !== "ADMIN" && <BanButton userId={u.id} isBanned={u.isBanned} />}
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
