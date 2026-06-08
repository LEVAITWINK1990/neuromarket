"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  reportId: string;
  productId: string;
  status: string;
}

export function ReportActions({ reportId, productId, status }: Props) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  function act(action: "DISMISS" | "RESOLVE" | "SUSPEND_PRODUCT") {
    startTransition(async () => {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, productId }),
      });
      if (!res.ok) {
        toast.error(t("failed"));
        return;
      }
      toast.success(t("updated"));
      router.refresh();
    });
  }
  if (status !== "OPEN" && status !== "UNDER_REVIEW") {
    return <span className="text-xs text-muted-foreground">{t("closed")}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      <Button size="sm" disabled={pending} onClick={() => act("RESOLVE")}>
        {t("reports_action_resolve")}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => act("SUSPEND_PRODUCT")}
      >
        {t("reports_action_suspend")}
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("DISMISS")}>
        {t("reports_action_dismiss")}
      </Button>
    </div>
  );
}
