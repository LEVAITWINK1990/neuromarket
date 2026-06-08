"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageActions({ messageId }: { messageId: string }) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  function call(body: Record<string, unknown>) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
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
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="flex w-[220px] flex-col gap-1">
      <Button size="sm" disabled={pending} onClick={() => call({ action: "UNFLAG" })}>
        {t("messages_action_unflag")}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending || !reason.trim()}
        onClick={() => call({ action: "REMOVE", reason })}
      >
        {t("messages_action_remove")}
      </Button>
      <Input
        placeholder={t("messages_input_reason")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-8"
      />
    </div>
  );
}
