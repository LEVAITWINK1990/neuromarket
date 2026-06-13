import { OrderDetailView } from "./order-detail-view";

export default function OrderPage({ params }: { params: { id: string } }) {
  return <OrderDetailView id={params.id} />;
}
