import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { AdminNav } from "../../_admin-nav";
import { ProductForm } from "../../../seller/products/product-form";

export const dynamic = "force-dynamic";

export default async function NewAdminProductPage() {
  await requireRole("ADMIN");
  const t = await getTranslations("admin");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="container max-w-3xl py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("new_product_title")}</h1>
        <AdminNav current="/admin/products" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("new_product_card_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            createEndpoint="/api/admin/products"
            uploadEndpoint="/api/admin/upload"
            redirectPath="/admin/products"
            submitLabel={t("new_product_submit")}
            hideReviewNotice
          />
        </CardContent>
      </Card>
    </div>
  );
}
