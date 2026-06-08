"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  providers: { google: boolean; apple: boolean };
}

export function SignInForm({ providers }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? "/";
  const t = useTranslations("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        toast.error(t("invalid_credentials"));
        return;
      }
      toast.success(t("signed_in"));
      router.push(callbackUrl);
      router.refresh();
    });
  }

  const showOAuth = providers.google || providers.apple;

  return (
    <div className="space-y-4">
      {showOAuth && (
        <div className="space-y-2">
          {providers.google && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl })}
              data-testid="sign-in-google"
            >
              <GoogleGlyph /> {t("with_google")}
            </Button>
          )}
          {providers.apple && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn("apple", { callbackUrl })}
              data-testid="sign-in-apple"
            >
              <AppleGlyph /> {t("with_apple")}
            </Button>
          )}
          <div className="relative my-2 text-center text-xs text-muted-foreground">
            <span className="bg-card px-2">{t("divider")}</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 border-t" />
          </div>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" className="mr-2" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.973 32.108 29.418 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.36 1.054 7.302 2.78l5.657-5.657C33.046 6.053 28.762 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c2.803 0 5.36 1.054 7.302 2.78l5.657-5.657C33.046 6.053 28.762 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c4.71 0 8.998-1.802 12.247-4.74l-5.652-4.78C28.66 35.864 26.46 37 24 37c-5.385 0-9.928-2.85-11.273-6.823l-6.522 5.025C9.557 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.631 1.802-1.793 3.367-3.298 4.481l5.652 4.78C39.96 33.66 44 28.5 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className="mr-2"
      aria-hidden
      fill="currentColor"
    >
      <path d="M17.05 12.04c.02-2.65 2.16-3.93 2.26-3.99-1.23-1.79-3.15-2.04-3.83-2.07-1.63-.16-3.18.95-4.01.95-.82 0-2.1-.93-3.46-.91-1.78.03-3.42 1.03-4.34 2.61-1.85 3.21-.47 7.94 1.33 10.53.88 1.27 1.93 2.69 3.3 2.64 1.33-.05 1.83-.86 3.43-.86 1.6 0 2.05.86 3.45.83 1.42-.02 2.32-1.29 3.19-2.56 1-1.47 1.42-2.9 1.45-2.97-.03-.01-2.77-1.07-2.77-4.2zm-2.64-7.71c.73-.88 1.22-2.11 1.08-3.33-1.05.04-2.31.7-3.06 1.58-.68.78-1.27 2.02-1.11 3.22 1.16.09 2.36-.59 3.09-1.47z" />
    </svg>
  );
}
