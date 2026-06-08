import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleNav } from "@/components/role-nav";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/wishlist", label: "Wishlist" },
  { href: "/dashboard/disputes", label: "Disputes" },
];

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/dashboard/wishlist");
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          category: true,
          seller: true,
          images: { take: 1, orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Wishlist</h1>
        <RoleNav items={NAV} current="/dashboard/wishlist" />
      </div>
      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No saved products yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tap the heart icon on any product to save it here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <ProductCard
              key={it.id}
              product={{
                id: it.product.id,
                slug: it.product.slug,
                title: it.product.title,
                shortDescription: it.product.shortDescription,
                priceCents: it.product.priceCents,
                currency: it.product.currency,
                rating: it.product.rating,
                ratingCount: it.product.ratingCount,
                stockQuantity: it.product.stockQuantity,
                status: it.product.status,
                isVerified: it.product.isVerified,
                productType: it.product.productType,
                deliveryType: it.product.deliveryType,
                category: it.product.category,
                seller: it.product.seller,
                images: it.product.images,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
