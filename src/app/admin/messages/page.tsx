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
import { requireRole } from "@/lib/guards";
import { AdminNav } from "../_admin-nav";
import { MessageActions } from "./actions";

export const dynamic = "force-dynamic";

// §7.3 — Admin Flagged Messages UI. The POST /api/messages handler trips
// `flagged=true` whenever containsSensitive() matches a body (emails,
// phone numbers, payment-app handles, etc.); this page surfaces those for
// human review.
//
// Actions live in actions.tsx and hit /api/admin/messages/[id]:
//   - UNFLAG  (false positive — keep the message)
//   - REMOVE  (policy violation — hard-delete the message, audit-logged)

export default async function AdminFlaggedMessagesPage() {
  await requireRole("ADMIN");
  const t = await getTranslations("admin");

  const messages = await prisma.message.findMany({
    where: { flagged: true },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      thread: {
        include: {
          buyer: { select: { name: true, email: true } },
          seller: { select: { name: true, email: true } },
          product: { select: { id: true, title: true, slug: true } },
        },
      },
    },
    take: 200,
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("messages_title")}</h1>
        <AdminNav current="/admin/messages" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("messages_count", { count: messages.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("messages_empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("messages_th_thread")}</TableHead>
                  <TableHead>{t("messages_th_sender")}</TableHead>
                  <TableHead>{t("messages_th_body")}</TableHead>
                  <TableHead>{t("messages_th_when")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => {
                  const isFromBuyer = m.senderId === m.thread.buyerId;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">
                        {m.thread.product ? (
                          <Link
                            href={`/products/${m.thread.product.slug}`}
                            className="font-medium hover:underline"
                          >
                            {m.thread.product.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{t("no_product")}</span>
                        )}
                        <div className="text-muted-foreground">
                          {m.thread.buyer.name} ↔ {m.thread.seller.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={isFromBuyer ? "secondary" : "outline"}>
                          {isFromBuyer ? t("messages_sender_buyer") : t("messages_sender_seller")}
                        </Badge>
                        <div className="mt-1">{m.sender.name ?? m.sender.email}</div>
                      </TableCell>
                      <TableCell className="max-w-[420px]">
                        <p className="whitespace-pre-wrap break-words text-xs">{m.body}</p>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(m.createdAt)}</TableCell>
                      <TableCell>
                        <MessageActions messageId={m.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{t("messages_footer")}</p>
    </div>
  );
}
