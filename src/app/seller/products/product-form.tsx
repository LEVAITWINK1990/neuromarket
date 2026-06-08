"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  initial?: {
    id: string;
    title: string;
    shortDescription: string;
    description: string;
    categoryId: string;
    productType: string;
    deliveryType: string;
    priceCents: number;
    stockQuantity: number;
    validityPeriod?: string | null;
    refundPolicy?: string | null;
    termsOfUse?: string | null;
    externalUrl?: string | null;
    digitalFileUrl?: string | null;
    manualDeliveryWindowHours: number;
    imageUrl?: string | null;
    codes?: string[];
  };
  /**
   * Endpoint to POST/PATCH the product to. Defaults to the seller endpoint.
   * Admin product page passes `/api/admin/products`.
   */
  createEndpoint?: string;
  updateEndpointBase?: string;
  /**
   * Endpoint to POST multipart image uploads to. Returns `{ url }`. When
   * omitted, the image input falls back to a plain text URL field.
   */
  uploadEndpoint?: string;
  /** Where to navigate after successful save. */
  redirectPath?: string;
  /** Override the submit button label (e.g. "Publish" for admin). */
  submitLabel?: string;
  /** Hide the "submitted for review" footer (e.g. on admin form). */
  hideReviewNotice?: boolean;
}

export function ProductForm({
  categories,
  initial,
  createEndpoint = "/api/seller/products",
  updateEndpointBase = "/api/seller/products",
  uploadEndpoint,
  redirectPath = "/seller/products",
  submitLabel,
  hideReviewNotice = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    productType: initial?.productType ?? "LICENSE_KEY",
    deliveryType: initial?.deliveryType ?? "INSTANT",
    price: initial ? (initial.priceCents / 100).toFixed(2) : "9.99",
    stockQuantity: initial?.stockQuantity ?? 1,
    validityPeriod: initial?.validityPeriod ?? "",
    refundPolicy: initial?.refundPolicy ?? "",
    termsOfUse: initial?.termsOfUse ?? "",
    externalUrl: initial?.externalUrl ?? "",
    digitalFileUrl: initial?.digitalFileUrl ?? "",
    manualDeliveryWindowHours: initial?.manualDeliveryWindowHours ?? 48,
    imageUrl: initial?.imageUrl ?? "",
    codes: (initial?.codes ?? []).join("\n"),
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(file: File) {
    if (!uploadEndpoint) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      update("imageUrl", data.url);
      toast.success("Image uploaded");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.description,
        categoryId: form.categoryId,
        productType: form.productType,
        deliveryType: form.deliveryType,
        priceCents: Math.round(Number(form.price) * 100),
        stockQuantity: Number(form.stockQuantity),
        validityPeriod: form.validityPeriod || undefined,
        refundPolicy: form.refundPolicy || undefined,
        termsOfUse: form.termsOfUse || undefined,
        externalUrl: form.externalUrl || undefined,
        digitalFileUrl: form.digitalFileUrl || undefined,
        manualDeliveryWindowHours: Number(form.manualDeliveryWindowHours),
        imageUrl: form.imageUrl || undefined,
        codes: form.codes
          .split(/\r?\n/)
          .map((c) => c.trim())
          .filter(Boolean),
      };
      const url = initial?.id ? `${updateEndpointBase}/${initial.id}` : createEndpoint;
      const res = await fetch(url, {
        method: initial?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not save product");
        return;
      }
      toast.success(initial?.id ? "Product updated" : (submitLabel ?? "Listing submitted"));
      router.push(redirectPath);
      router.refresh();
    });
  }

  const showCodes = form.productType === "LICENSE_KEY" || form.productType === "VOUCHER_CODE";
  const showFile = form.productType === "DIGITAL_FILE";
  const showExternal = form.productType === "AFFILIATE_OFFER";
  const showManualWindow =
    form.deliveryType === "MANUAL" ||
    form.productType === "MANUAL_DELIVERY" ||
    form.productType === "SERVICE";

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          required
          minLength={3}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Short description</Label>
        <Input
          required
          maxLength={280}
          value={form.shortDescription}
          onChange={(e) => update("shortDescription", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          required
          rows={6}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Product type</Label>
          <select
            value={form.productType}
            onChange={(e) => update("productType", e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="LICENSE_KEY">License key</option>
            <option value="VOUCHER_CODE">Voucher code</option>
            <option value="DIGITAL_FILE">Digital file</option>
            <option value="MANUAL_DELIVERY">Manual delivery</option>
            <option value="SERVICE">Service</option>
            <option value="AFFILIATE_OFFER">Affiliate offer</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Delivery type</Label>
          <select
            value={form.deliveryType}
            onChange={(e) => update("deliveryType", e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="INSTANT">Instant</option>
            <option value="MANUAL">Manual</option>
            <option value="EXTERNAL_LINK">External link</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Price (RUB)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Stock quantity</Label>
          <Input
            type="number"
            min="0"
            value={form.stockQuantity}
            onChange={(e) => update("stockQuantity", Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Image</Label>
          {uploadEndpoint ? (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
                className="block w-full text-sm file:mr-2 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5"
              />
              {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="h-32 w-32 rounded-md border object-cover"
                />
              )}
              <Input
                value={form.imageUrl}
                placeholder="Or paste an image URL"
                onChange={(e) => update("imageUrl", e.target.value)}
              />
            </div>
          ) : (
            <Input
              value={form.imageUrl}
              placeholder="https://cdn.your-storage.example/…"
              onChange={(e) => update("imageUrl", e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Validity period</Label>
          <Input
            value={form.validityPeriod}
            placeholder="e.g. 30 days"
            onChange={(e) => update("validityPeriod", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Refund policy</Label>
          <Input
            value={form.refundPolicy}
            placeholder="e.g. 24h refund if unused"
            onChange={(e) => update("refundPolicy", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Terms of use</Label>
        <Textarea
          value={form.termsOfUse}
          rows={3}
          onChange={(e) => update("termsOfUse", e.target.value)}
        />
      </div>

      {showCodes && (
        <div className="space-y-2">
          <Label>Inventory codes (one per line)</Label>
          <Textarea
            value={form.codes}
            placeholder={"CODE-1\nCODE-2\nCODE-3"}
            rows={6}
            onChange={(e) => update("codes", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Codes are stored securely and only revealed to a buyer after their payment is captured.
          </p>
        </div>
      )}
      {showFile && (
        <div className="space-y-2">
          <Label>Digital file URL</Label>
          <Input
            value={form.digitalFileUrl}
            placeholder="https://your-storage/example.zip"
            onChange={(e) => update("digitalFileUrl", e.target.value)}
          />
        </div>
      )}
      {showExternal && (
        <div className="space-y-2">
          <Label>External offer URL</Label>
          <Input
            value={form.externalUrl}
            placeholder="https://partner.example.com/?ref=neuromarket"
            onChange={(e) => update("externalUrl", e.target.value)}
          />
        </div>
      )}
      {showManualWindow && (
        <div className="space-y-2">
          <Label>Manual delivery window (hours)</Label>
          <Input
            type="number"
            min="1"
            max="720"
            value={form.manualDeliveryWindowHours}
            onChange={(e) => update("manualDeliveryWindowHours", Number(e.target.value))}
          />
        </div>
      )}

      {!hideReviewNotice && (
        <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          By submitting, you confirm that you have the right to sell this digital product, and that
          it is not a stolen account, cracked software, leaked API key, or unauthorized resale of a
          third-party subscription. New listings are reviewed by an admin before going live.
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending || uploading} data-testid="submit-product">
          {initial?.id ? "Save changes" : (submitLabel ?? "Submit for review")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
