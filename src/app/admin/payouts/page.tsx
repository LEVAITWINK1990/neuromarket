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
import { decryptString, isEncrypted } from "@/lib/crypto";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/lib/guards";
import { AdminNav } from "../_admin-nav";
import { PayoutActions } from "./actions";

export const dynamic = "force-dynamic";

// §7.2 — Admin Payouts UI. Lists all payouts most-recent-first with the
// bank details decrypted in-page (kept server-side: never crosses the
// network as ciphertext is decrypted right before render). Admin actions
// (APPROVE / MARK_PAID / REJECT) live in actions.tsx and hit
// /api/admin/payouts/[id].
//
// Note: the actual money transfer happens OUTSIDE the system (manual bank
// wire / СБП / Юmoney transfer). MARK_PAID is the admin's confirmation
// that the external transfer is done — it walks availableBalance →
// withdrawnBalance for the seller.

type PayoutBucketKey =
  | "payouts_status_new"
  | "payouts_status_processing"
  | "payouts_status_paid"
  | "payouts_status_failed";

function bucketLabel(status: string): {
  key: PayoutBucketKey | null;
  raw: string;
  variant: "secondary" | "outline" | "default" | "destructive";
} {
  switch (status) {
    case "PENDING":
    case "REQUESTED":
      return { key: "payouts_status_new", raw: status, variant: "secondary" };
    case "PROCESSING":
      return { key: "payouts_status_processing", raw: status, variant: "outline" };
    case "PAID":
      return { key: "payouts_status_paid", raw: status, variant: "default" };
    case "FAILED":
      return { key: "payouts_status_failed", raw: status, variant: "destructive" };
    default:
      return { key: null, raw: status, variant: "secondary" };
  }
}

function safeDecrypt(value: string | null): string | null {
  if (!value) return null;
  if (!isEncrypted(value)) return value;
  try {
    return decryptString(value);
  } catch {
    return null;
  }
}

export default async function AdminPayoutsPage() {
  await requireRole("ADMIN");
  const t = await getTranslations("admin");

  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: {
          id: true,
          displayName: true,
          user: { select: { email: true } },
        },
      },
      processedBy: { select: { name: true, email: true } },
    },
  });

  const openCount = payouts.filter(
    (p) => p.status === "PENDING" || p.status === "REQUESTED",
  ).length;

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("payouts_title")}</h1>
        <AdminNav current="/admin/payouts" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("payouts_count", { count: payouts.length, open: openCount })}</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("payouts_empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payouts_th_seller")}</TableHead>
                  <TableHead>{t("payouts_th_amount")}</TableHead>
                  <TableHead>{t("payouts_th_details")}</TableHead>
                  <TableHead>{t("payouts_th_status")}</TableHead>
                  <TableHead>{t("payouts_th_requested")}</TableHead>
                  <TableHead>{t("payouts_th_processed")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => {
                  const bucket = bucketLabel(p.status);
                  const decrypted = safeDecrypt(p.detailsEncrypted);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.seller.displayName}</div>
                        <div className="text-xs text-muted-foreground">{p.seller.user.email}</div>
                      </TableCell>
                      <TableCell className="font-mono">
                        ₽{(p.amountCents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {decrypted ? (
                          <code className="block whitespace-pre-wrap break-words text-xs">
                            {decrypted}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("no_details")}</span>
                        )}
                        {p.externalTxnId ? (
                          <div className="mt-1 text-xs">
                            {t("txn_label")} <span className="font-mono">{p.externalTxnId}</span>
                          </div>
                        ) : null}
                        {p.failureReason ? (
                          <div className="mt-1 text-xs text-destructive">
                            {t("reason_label")} {p.failureReason}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bucket.variant}>
                          {bucket.key ? t(bucket.key) : bucket.raw}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-xs">
                        {p.processedBy ? (
                          <>
                            <div>{p.processedBy.name ?? p.processedBy.email}</div>
                            <div className="text-muted-foreground">
                              {p.processedAt ? formatDate(p.processedAt) : "—"}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PayoutActions payoutId={p.id} status={p.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{t("payouts_footer")}</p>
    </div>
  );
}
