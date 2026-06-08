import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { RoleNav } from "@/components/role-nav";
import { RequestPayoutButton } from "./request";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/verification", label: "Verification" },
];

export default async function SellerPayouts() {
  const session = await auth();
  if (!session?.user.sellerProfileId) redirect("/seller");
  const [profile, payouts] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { id: session.user.sellerProfileId } }),
    prisma.payout.findMany({
      where: { sellerId: session.user.sellerProfileId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!profile) redirect("/seller");

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <RoleNav items={NAV} current="/seller/payouts" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-xs uppercase text-muted-foreground">Pending balance</div>
            <div className="mt-1 text-2xl font-semibold">{formatPrice(profile.pendingBalance)}</div>
            <div className="text-xs text-muted-foreground">Held until delivery is confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs uppercase text-muted-foreground">Available balance</div>
            <div className="mt-1 text-2xl font-semibold">{formatPrice(profile.availableBalance)}</div>
            <RequestPayoutButton
              disabled={profile.availableBalance <= 0}
              amount={profile.availableBalance}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs uppercase text-muted-foreground">Total withdrawn</div>
            <div className="mt-1 text-2xl font-semibold">{formatPrice(profile.withdrawnBalance)}</div>
            <div className="text-xs text-muted-foreground">Lifetime</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No payouts yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatPrice(p.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.status.toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>{p.method ?? "bank"}</TableCell>
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
