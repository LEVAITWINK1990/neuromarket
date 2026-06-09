import type { DemoProduct } from "@/lib/types";

export function discountPercent(product: Pick<DemoProduct, "price" | "originalPrice">) {
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export function buildDeliveredAsset(
  product: Pick<DemoProduct, "id" | "productType" | "deliveryType">,
) {
  if (product.productType === "DIGITAL_FILE") {
    return "Download ready: /vault/ai-playbook.pdf";
  }

  if (product.deliveryType === "MANUAL") {
    return "Seller booked kickoff window within 2 hours.";
  }

  return `NM-${product.id.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function filterProducts(
  products: DemoProduct[],
  filters: {
    q?: string;
    category?: string;
    delivery?: string;
    sort?: string;
  },
) {
  const query = (filters.q ?? "").toLowerCase();

  return [...products]
    .filter((product) =>
      query
        ? `${product.title} ${product.shortDescription} ${product.description}`
            .toLowerCase()
            .includes(query)
        : true,
    )
    .filter((product) => (filters.category ? product.categoryId === filters.category : true))
    .filter((product) => (filters.delivery ? product.deliveryType === filters.delivery : true))
    .sort((left, right) => {
      if (filters.sort === "price-asc") return left.price - right.price;
      if (filters.sort === "price-desc") return right.price - left.price;
      if (filters.sort === "rating") return right.rating - left.rating;
      if (filters.sort === "newest") return right.id.localeCompare(left.id);
      return right.salesCount - left.salesCount;
    });
}
