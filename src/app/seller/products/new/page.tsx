import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleNav } from "@/components/role-nav";
import { ProductForm } from "../product-form";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/verification", label: "Verification" },
];

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user.sellerProfileId) redirect("/seller");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="container py-10 space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">New product listing</h1>
        <RoleNav items={NAV} current="/seller/products" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>List a digital product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
