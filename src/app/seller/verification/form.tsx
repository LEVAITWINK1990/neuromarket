"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  initial?: {
    fullName: string;
    country: string;
    contactEmail: string;
    websiteUrl?: string;
    productsDescription: string;
    authorizationNotes: string;
  };
}

export function VerificationForm({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    fullName: initial?.fullName ?? "",
    country: initial?.country ?? "",
    contactEmail: initial?.contactEmail ?? "",
    websiteUrl: initial?.websiteUrl ?? "",
    productsDescription: initial?.productsDescription ?? "",
    authorizationNotes: initial?.authorizationNotes ?? "",
    acceptedRules: false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.acceptedRules) {
      toast.error("You must accept the marketplace rules.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/seller/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not submit");
        return;
      }
      toast.success("Submitted! Admin will review your request.");
      router.refresh();
    });
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Full name or company</Label>
          <Input
            required
            minLength={2}
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input
            required
            minLength={2}
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Contact email</Label>
          <Input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Website / social link</Label>
          <Input value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>What do you sell?</Label>
        <Textarea
          required
          minLength={10}
          rows={3}
          value={form.productsDescription}
          onChange={(e) => update("productsDescription", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Authorization &amp; notes</Label>
        <Textarea
          required
          minLength={10}
          rows={3}
          placeholder="Confirm you have the right to sell each product you list. Mention partner programs if applicable."
          value={form.authorizationNotes}
          onChange={(e) => update("authorizationNotes", e.target.value)}
        />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          required
          checked={form.acceptedRules}
          onChange={(e) => update("acceptedRules", e.target.checked)}
          className="mt-1"
        />
        <span>
          I have read the marketplace rules. I will not list stolen accounts, cracked software, leaked
          API keys, or unauthorized third-party subscriptions.
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        Submit for review
      </Button>
    </form>
  );
}
