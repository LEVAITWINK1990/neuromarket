"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function DisputeActions({ disputeId, status }: { disputeId: string; status: string }) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  function act(action: "REFUND_BUYER" | "RELEASE_TO_SELLER" | "REJECT") {
    startTransition(async () => {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast.error(t("failed"));
        return;
      }
      toast.success(t("resolved"));
      router.refresh();
    });
  }
  if (status !== "OPEN" && status !== "UNDER_REVIEW") {
    return <span className="text-xs text-muted-foreground">{t("decided")}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      <Button size="sm" disabled={pending} onClick={() => act("REFUND_BUYER")}>
        {t("disputes_action_refund")}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => act("RELEASE_TO_SELLER")}
      >
        {t("disputes_action_release")}
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => act("REJECT")}>
        {t("disputes_action_reject")}
      </Button>
    </div>
  );
}
