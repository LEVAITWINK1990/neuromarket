import { ProductDetailView } from "./product-detail-view";

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailView slug={params.slug} />;
}
