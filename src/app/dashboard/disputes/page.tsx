import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { RoleNav } from "@/components/role-nav";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/wishlist", label: "Wishlist" },
  { href: "/dashboard/disputes", label: "Disputes" },
];

export default async function DisputesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/dashboard/disputes");
  const disputes = await prisma.dispute.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { order: { include: { items: true } } },
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Disputes &amp; support</h1>
        <RoleNav items={NAV} current="/dashboard/disputes" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{disputes.length} dispute(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              You have not opened any disputes. You can open one from an order page if needed.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/orders/${d.orderId}`} className="font-medium text-primary hover:underline">
                        {d.order.items[0]?.title ?? "Order"}
                      </Link>
                      <div className="text-xs text-muted-foreground">#{d.orderId.slice(-8)}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{d.reason}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{d.status.replace(/_/g, " ").toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(d.createdAt)}</TableCell>
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
