"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function BanButton({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant={isBanned ? "outline" : "destructive"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await fetch(`/api/admin/users/${userId}/ban`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ banned: !isBanned }),
          });
          if (!res.ok) {
            toast.error(t("failed"));
            return;
          }
          toast.success(isBanned ? t("users_unban_success") : t("users_ban_success"));
          router.refresh();
        })
      }
    >
      {isBanned ? t("users_unban") : t("users_ban")}
    </Button>
  );
}
