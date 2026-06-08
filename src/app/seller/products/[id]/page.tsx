import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleNav } from "@/components/role-nav";
import { ProductForm } from "../product-form";
import { decryptString, isEncrypted } from "@/lib/crypto";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/verification", label: "Verification" },
];

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user.sellerProfileId) redirect("/seller");
  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, sellerId: session.user.sellerProfileId },
      include: { images: true, inventoryItems: { where: { status: "AVAILABLE" } } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="container py-10 space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Edit product</h1>
        <RoleNav items={NAV} current="/seller/products" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{product.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            initial={{
              id: product.id,
              title: product.title,
              shortDescription: product.shortDescription,
              description: product.description,
              categoryId: product.categoryId,
              productType: product.productType,
              deliveryType: product.deliveryType,
              priceCents: product.priceCents,
              stockQuantity: product.stockQuantity,
              validityPeriod: product.validityPeriod,
              refundPolicy: product.refundPolicy,
              termsOfUse: product.termsOfUse,
              externalUrl: product.externalUrl,
              digitalFileUrl: product.digitalFileUrl,
              manualDeliveryWindowHours: product.manualDeliveryWindowHours,
              imageUrl: product.images[0]?.url ?? "",
              // §6.2 — codes are encrypted at rest; decrypt for the owning
              // seller's edit form. Legacy plaintext rows pass through.
              codes: product.inventoryItems.map((i) =>
                isEncrypted(i.code) ? decryptString(i.code) : i.code,
              ),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
