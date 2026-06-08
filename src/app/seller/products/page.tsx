import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { RoleNav } from "@/components/role-nav";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/verification", label: "Verification" },
];

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING_REVIEW: { label: "Pending review", variant: "warning" },
  PUBLISHED: { label: "Published", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
};

export default async function SellerProducts() {
  const session = await auth();
  if (!session?.user.sellerProfileId) redirect("/seller");
  const products = await prisma.product.findMany({
    where: { sellerId: session.user.sellerProfileId },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      _count: { select: { inventoryItems: { where: { status: "AVAILABLE" } } } },
    },
  });
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Your products</h1>
        <div className="flex items-center gap-2">
          <RoleNav items={NAV} current="/seller/products" />
          <Link href="/seller/products/new">
            <Button>New listing</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{products.length} product(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              You haven&apos;t listed anything yet.{" "}
              <Link href="/seller/products/new" className="text-primary hover:underline">
                Create your first listing
              </Link>
              .
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available codes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const meta = STATUS_LABEL[p.status] ?? { label: p.status, variant: "secondary" as const };
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {p.shortDescription}
                        </div>
                      </TableCell>
                      <TableCell>{p.category.name}</TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell>{formatPrice(p.priceCents)}</TableCell>
                      <TableCell>{p._count.inventoryItems}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/seller/products/${p.id}`}>
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </Link>
                          {p.status === "PUBLISHED" && (
                            <Link href={`/products/${p.slug}`} target="_blank">
                              <Button size="sm" variant="ghost">
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
