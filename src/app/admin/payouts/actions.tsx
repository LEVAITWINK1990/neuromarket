"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PayoutActions({ payoutId, status }: { payoutId: string; status: string }) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  const [txnInput, setTxnInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");

  function call(body: Record<string, unknown>) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? t("failed"));
        return;
      }
      toast.success(t("updated"));
      setTxnInput("");
      setReasonInput("");
      router.refresh();
    });
  }

  if (status === "PAID" || status === "FAILED") {
    return <span className="text-xs text-muted-foreground">{t("closed")}</span>;
  }

  if (status === "PROCESSING") {
    return (
      <div className="flex w-[260px] flex-col gap-1">
        <Input
          placeholder={t("payouts_input_txn")}
          value={txnInput}
          onChange={(e) => setTxnInput(e.target.value)}
          className="h-8"
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            disabled={pending}
            onClick={() => call({ action: "MARK_PAID", externalTxnId: txnInput || undefined })}
          >
            {t("payouts_action_mark_paid")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || !reasonInput.trim()}
            onClick={() => call({ action: "REJECT", failureReason: reasonInput })}
          >
            {t("payouts_action_reject")}
          </Button>
        </div>
        <Input
          placeholder={t("payouts_input_reason")}
          value={reasonInput}
          onChange={(e) => setReasonInput(e.target.value)}
          className="h-8"
        />
      </div>
    );
  }

  // PENDING / REQUESTED
  return (
    <div className="flex w-[200px] flex-col gap-1">
      <Button size="sm" disabled={pending} onClick={() => call({ action: "APPROVE" })}>
        {t("payouts_action_approve")}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending || !reasonInput.trim()}
        onClick={() => call({ action: "REJECT", failureReason: reasonInput })}
      >
        {t("payouts_action_reject")}
      </Button>
      <Input
        placeholder={t("payouts_input_reason")}
        value={reasonInput}
        onChange={(e) => setReasonInput(e.target.value)}
        className="h-8"
      />
    </div>
  );
}
