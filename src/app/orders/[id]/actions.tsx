"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ConfirmDeliveryButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
          if (!res.ok) {
            toast.error("Could not confirm delivery");
            return;
          }
          toast.success("Delivery confirmed. Seller earnings released.");
          router.refresh();
        })
      }
      disabled={pending}
      data-testid="confirm-delivery"
    >
      Confirm delivery
    </Button>
  );
}

export function OpenDisputeButton({ orderId, disabled }: { orderId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} data-testid="open-dispute">
          Open dispute
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a dispute</DialogTitle>
          <DialogDescription>
            Tell us what went wrong. Funds will remain held in escrow until the dispute is resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Reason</Label>
            <Input placeholder="e.g. Code is invalid" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={4}
              placeholder="Describe the issue in detail."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await fetch("/api/disputes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId, reason, description }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  toast.error(data.error ?? "Could not open dispute");
                  return;
                }
                toast.success("Dispute opened. Our team will review it.");
                setOpen(false);
                router.refresh();
              })
            }
          >
            Submit dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LeaveReviewButton({ orderId, productId }: { orderId: string; productId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="leave-review">Leave a review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
          <DialogDescription>One review per completed order. Reviews are public.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`text-xl ${n <= rating ? "text-amber-400" : "text-muted-foreground"}`}
                  aria-label={`${n} star`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Review</Label>
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await fetch("/api/reviews", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId, productId, rating, text }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  toast.error(data.error ?? "Could not submit review");
                  return;
                }
                toast.success("Review submitted!");
                setOpen(false);
                router.refresh();
              })
            }
          >
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
