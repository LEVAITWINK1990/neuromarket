import { Badge } from "@/components/ui/badge";

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: "default" | "secondary" | "success" | "destructive" | "warning" }
  > = {
    PENDING_PAYMENT: { label: "Pending payment", variant: "secondary" },
    PAID: { label: "Paid", variant: "default" },
    DELIVERED: { label: "Delivered", variant: "success" },
    COMPLETED: { label: "Completed", variant: "success" },
    DISPUTED: { label: "Disputed", variant: "destructive" },
    REFUNDED: { label: "Refunded", variant: "warning" },
    CANCELLED: { label: "Cancelled", variant: "secondary" },
  };
  const meta = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
