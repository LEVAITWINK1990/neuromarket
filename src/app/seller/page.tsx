import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { RoleNav } from "@/components/role-nav";
import { SellerRevenueChart } from "./revenue-chart";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/verification", label: "Verification" },
];

export default async function SellerOverview() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/seller");
  if (!session.user.sellerProfileId) {
    return (
      <div className="container py-16">
        <Card>
          <CardHeader>
            <CardTitle>Seller profile not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your account does not have a seller profile yet. Become a seller to start listing products.
            </p>
            <Link href="/sign-up">
              <Button>Switch to seller account</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sellerId = session.user.sellerProfileId;
  const profile = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
  if (!profile) redirect("/");

  const [products, orderItems, commissions] = await Promise.all([
    prisma.product.count({ where: { sellerId, status: { in: ["PUBLISHED", "PENDING_REVIEW"] } } }),
    prisma.orderItem.findMany({
      where: { sellerId, order: { status: { in: ["PAID", "DELIVERED", "COMPLETED"] } } },
      include: { order: true },
    }),
    prisma.commissionRecord.findMany({
      where: { sellerId },
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  const totalRevenue = orderItems.reduce((acc, oi) => acc + oi.priceCents, 0);
  const refunds = await prisma.order.count({
    where: { status: "REFUNDED", items: { some: { sellerId } } },
  });
  const ordersTotal = orderItems.length;
  const conversionRate = 0; // placeholder for now (no view tracking)

  // Group commissions by month for chart
  const byMonth = new Map<string, number>();
  for (const c of commissions) {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + c.sellerEarningsCents);
  }
  const chartData = Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, cents]) => ({ month, revenue: cents / 100 }));

  // Top products
  const top = await prisma.product.findMany({
    where: { sellerId },
    orderBy: { salesCount: "desc" },
    take: 5,
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant={profile.verificationStatus === "APPROVED" ? "success" : "warning"}>
            {profile.verificationStatus === "APPROVED" ? "Verified seller" : "Verification: " + profile.verificationStatus.toLowerCase()}
          </Badge>
          <h1 className="mt-2 text-2xl font-semibold">{profile.displayName} dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track sales, manage listings, and request seller verification.
          </p>
        </div>
        <RoleNav items={NAV} current="/seller" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total revenue" value={formatPrice(totalRevenue)} sub={`${ordersTotal} orders`} />
        <StatCard
          title="Available balance"
          value={formatPrice(profile.availableBalance)}
          sub={`Pending: ${formatPrice(profile.pendingBalance)}`}
        />
        <StatCard
          title="Average rating"
          value={profile.rating.toFixed(1)}
          sub={`${profile.ratingCount} reviews`}
        />
        <StatCard
          title="Refunds / disputes"
          value={refunds.toString()}
          sub={`Conv. rate: ${conversionRate.toFixed(1)}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by month</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No sales yet. List a product to start selling.
              </div>
            ) : (
              <SellerRevenueChart data={chartData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent>
            {top.length === 0 ? (
              <div className="text-sm text-muted-foreground">No products yet.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {top.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <Link className="hover:underline" href={`/products/${p.slug}`}>
                      {p.title}
                    </Link>
                    <span className="text-muted-foreground">{p.salesCount} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active products</CardTitle>
            <Link href="/seller/products/new">
              <Button size="sm">Create listing</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="text-sm">
          You have {products} active products. Manage them from the{" "}
          <Link href="/seller/products" className="text-primary hover:underline">
            products page
          </Link>
          .
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-xs uppercase text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
