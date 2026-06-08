"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  requestId: string;
  sellerId: string;
  status: string;
}

export function VerificationActions({ requestId, sellerId, status }: Props) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  function act(action: "APPROVE" | "REJECT") {
    startTransition(async () => {
      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sellerId }),
      });
      if (!res.ok) {
        toast.error(t("failed"));
        return;
      }
      toast.success(t("updated"));
      router.refresh();
    });
  }
  if (status !== "PENDING")
    return <span className="text-xs text-muted-foreground">{t("decided")}</span>;
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => act("APPROVE")}
        data-testid="approve-verification"
      >
        {t("verifications_action_approve")}
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => act("REJECT")}>
        {t("verifications_action_reject")}
      </Button>
    </div>
  );
}
