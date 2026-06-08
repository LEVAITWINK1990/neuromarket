"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarkDeliveredButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      onClick={() =>
        startTransition(async () => {
          const res = await fetch(`/api/seller/order-items/${itemId}/deliver`, { method: "POST" });
          if (!res.ok) {
            toast.error("Could not mark as delivered");
            return;
          }
          toast.success("Marked as delivered. Funds released to escrow.");
          router.refresh();
        })
      }
      disabled={pending}
    >
      Mark delivered
    </Button>
  );
}
