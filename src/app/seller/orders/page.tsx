import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { RoleNav } from "@/components/role-nav";
import { MarkDeliveredButton } from "./actions";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/verification", label: "Verification" },
];

export default async function SellerOrders() {
  const session = await auth();
  if (!session?.user.sellerProfileId) redirect("/seller");
  const orders = await prisma.orderItem.findMany({
    where: { sellerId: session.user.sellerProfileId },
    include: { order: { include: { buyer: { select: { name: true, email: true } } } } },
    orderBy: { id: "desc" },
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Seller orders</h1>
        <RoleNav items={NAV} current="/seller/orders" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{orders.length} order item(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No orders yet. Your first sale will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="font-medium">{it.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.productType.replace(/_/g, " ").toLowerCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{it.order.buyer.name}</div>
                      <div className="text-muted-foreground">{it.order.buyer.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{it.order.status.replace(/_/g, " ").toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(it.createdAt)}</TableCell>
                    <TableCell>{formatPrice(it.priceCents)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/orders/${it.orderId}`}>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </Link>
                        {!it.deliveredAt &&
                          (it.productType === "MANUAL_DELIVERY" || it.productType === "SERVICE") &&
                          (it.order.status === "PAID" || it.order.status === "DELIVERED") && (
                            <MarkDeliveredButton itemId={it.id} />
                          )}
                      </div>
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
