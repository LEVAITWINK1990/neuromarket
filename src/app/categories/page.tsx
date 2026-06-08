import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { status: "PUBLISHED" } } } } },
  });
  const t = await getTranslations("categories_page");
  return (
    <div className="container py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle", { count: categories.length })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} href={`/marketplace?category=${c.slug}`}>
            <Card className="hover:border-primary/40 transition">
              <CardContent className="p-6 space-y-2">
                <div className="font-medium">{c.name}</div>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                <div className="text-xs text-muted-foreground">
                  {c._count.products === 1
                    ? t("active_one", { count: c._count.products })
                    : t("active_other", { count: c._count.products })}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
