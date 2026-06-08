"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const router = useRouter();
  const t = useTranslations("sign_up");
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? t("error_generic"));
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast.error(t("error_signin_after_create"));
        return;
      }
      toast.success(t("welcome"));
      router.push(role === "SELLER" ? "/seller/verification" : "/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">{t("display_name")}</Label>
        <Input
          id="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("i_want_to")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["BUYER", "SELLER"] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-md border p-3 text-sm text-left transition-colors ${
                role === r ? "border-primary bg-primary/5" : "hover:bg-accent"
              }`}
            >
              <div className="font-medium">
                {r === "BUYER" ? t("role_buyer_title") : t("role_seller_title")}
              </div>
              <div className="text-xs text-muted-foreground">
                {r === "BUYER" ? t("role_buyer_body") : t("role_seller_body")}
              </div>
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
