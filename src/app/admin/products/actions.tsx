"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  productId: string;
  status: string;
}

export function ProductModerationActions({ productId, status }: Props) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();

  function act(action: "APPROVE" | "REJECT" | "SUSPEND" | "REPUBLISH") {
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast.error(t("failed"));
        return;
      }
      toast.success(t("updated"));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {status === "PENDING_REVIEW" && (
        <>
          <Button
            size="sm"
            disabled={pending}
            data-testid="approve-product"
            onClick={() => act("APPROVE")}
          >
            {t("products_action_approve")}
          </Button>
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => act("REJECT")}>
            {t("products_action_reject")}
          </Button>
        </>
      )}
      {status === "PUBLISHED" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => act("SUSPEND")}>
          {t("products_action_suspend")}
        </Button>
      )}
      {(status === "REJECTED" || status === "SUSPENDED") && (
        <Button size="sm" disabled={pending} onClick={() => act("REPUBLISH")}>
          {t("products_action_republish")}
        </Button>
      )}
    </div>
  );
}
