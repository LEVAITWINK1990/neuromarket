"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Flag, Heart, ShoppingCart, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addToCompare } from "@/components/compare-store";

interface Props {
  productId: string;
  slug: string;
  isSignedIn: boolean;
  inStock: boolean;
  isOwnSeller: boolean;
}

const REPORT_REASON_VALUES = [
  "UNAUTHORIZED_RESALE",
  "STOLEN_ACCOUNT",
  "FAKE_PRODUCT",
  "MISLEADING_DESCRIPTION",
  "ILLEGAL_CONTENT",
  "DUPLICATE_LISTING",
  "OTHER",
] as const;
type ReportReason = (typeof REPORT_REASON_VALUES)[number];

export function ProductActions({ productId, slug, isSignedIn, inStock, isOwnSeller }: Props) {
  const router = useRouter();
  const t = useTranslations("product");
  const [pending, startTransition] = useTransition();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("UNAUTHORIZED_RESALE");
  const [reportText, setReportText] = useState("");

  async function buy() {
    if (!isSignedIn) {
      router.push(`/sign-in?callbackUrl=/products/${slug}`);
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? t("checkout_error"));
        return;
      }
      const data: { orderId: string; checkoutUrl: string } = await res.json();
      router.push(data.checkoutUrl);
    });
  }

  async function wishlist() {
    if (!isSignedIn) {
      router.push(`/sign-in?callbackUrl=/products/${slug}`);
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        toast.error(t("wishlist_error"));
        return;
      }
      const data: { saved: boolean } = await res.json();
      toast.success(data.saved ? t("wishlist_added") : t("wishlist_removed"));
    });
  }

  async function submitReport() {
    startTransition(async () => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, reason, description: reportText }),
      });
      if (!res.ok) {
        toast.error(t("report_error"));
        return;
      }
      setReportOpen(false);
      setReportText("");
      toast.success(t("report_success"));
    });
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        onClick={buy}
        disabled={pending || !inStock || isOwnSeller}
        data-testid="buy-now"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {isOwnSeller ? t("own_listing") : inStock ? t("buy_now") : t("out_of_stock")}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={wishlist} disabled={pending}>
          <Heart className="mr-2 h-4 w-4" /> {t("wishlist")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            addToCompare(productId);
            toast.success(t("compare_added"));
          }}
        >
          <GitCompareArrows className="mr-2 h-4 w-4" />
          {t("compare")}
        </Button>
      </div>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
            <Flag className="mr-2 h-3.5 w-3.5" /> {t("report_button")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("report_title")}</DialogTitle>
            <DialogDescription>{t("report_subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("report_reason")}</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              >
                {REPORT_REASON_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {t(`report_reason_${v}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("report_details")}</Label>
              <Textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              {t("report_cancel")}
            </Button>
            <Button onClick={submitReport} disabled={pending}>
              {t("report_submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
