"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export function RequestPayoutButton({ disabled, amount }: { disabled: boolean; amount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      className="mt-3 w-full"
      disabled={disabled || pending}
      size="sm"
      onClick={() =>
        startTransition(async () => {
          const res = await fetch("/api/seller/payouts", { method: "POST" });
          if (!res.ok) {
            toast.error("Could not request payout");
            return;
          }
          toast.success("Payout requested");
          router.refresh();
        })
      }
    >
      Request {formatPrice(amount)} payout
    </Button>
  );
}
