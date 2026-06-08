import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ConfirmDeliveryButton, OpenDisputeButton, LeaveReviewButton } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect(`/sign-in?callbackUrl=/orders/${params.id}`);
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: { include: { seller: true } } } },
      payment: true,
      dispute: true,
      reviews: true,
    },
  });
  if (!order) notFound();
  const isBuyer = order.buyerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const isSellerOfOrder =
    session.user.role === "SELLER" &&
    order.items.some((i) => i.sellerId === session.user.sellerProfileId);
  if (!isBuyer && !isAdmin && !isSellerOfOrder) redirect("/");

  return (
    <div className="container py-10 max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="secondary">Order #{order.id.slice(-8)}</Badge>
          <h1 className="mt-2 text-2xl font-semibold">{order.items[0]?.title ?? "Order"}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((it) => (
            <div key={it.id} className="rounded-md border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Sold by {it.product.seller.displayName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice(it.priceCents)}</div>
                  <div className="text-xs text-muted-foreground">qty {it.quantity}</div>
                </div>
              </div>

              {order.status === "PENDING_PAYMENT" && (
                <div className="rounded-md bg-amber-500/10 p-3 text-sm">
                  Payment pending.{" "}
                  {order.payment?.confirmationUrl ? (
                    <Link
                      className="text-primary hover:underline"
                      href={order.payment.confirmationUrl}
                    >
                      Complete payment
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Awaiting payment confirmation…</span>
                  )}
                </div>
              )}
              {(order.status === "PAID" ||
                order.status === "DELIVERED" ||
                order.status === "COMPLETED") && <DeliveryBlock item={it} isBuyer={isBuyer} />}
            </div>
          ))}
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotalCents, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span>{formatPrice(order.platformFeeCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing fee</span>
              <span>{formatPrice(order.processingFeeCents)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total paid</span>
              <span>{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isBuyer && (order.status === "DELIVERED" || order.status === "PAID") && (
        <Card>
          <CardHeader>
            <CardTitle>Order actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Once you confirm delivery, funds are released from escrow to the seller. If something
              is wrong, open a dispute.
            </p>
            <div className="flex flex-wrap gap-2">
              <ConfirmDeliveryButton orderId={order.id} />
              <OpenDisputeButton orderId={order.id} disabled={!!order.dispute} />
            </div>
          </CardContent>
        </Card>
      )}

      {isBuyer &&
        (order.status === "COMPLETED" || order.status === "DELIVERED") &&
        order.reviews.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Leave a review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((it) => (
                <LeaveReviewButton key={it.id} orderId={order.id} productId={it.productId} />
              ))}
            </CardContent>
          </Card>
        )}

      {order.dispute && (
        <Card>
          <CardHeader>
            <CardTitle>Dispute</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Reason: </span>
              {order.dispute.reason}
            </div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <Badge variant="secondary">
                {order.dispute.status.replace(/_/g, " ").toLowerCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 whitespace-pre-line">
              {order.dispute.description}
            </p>
            {order.dispute.resolution && (
              <p className="mt-2">
                <span className="text-muted-foreground">Resolution: </span>
                {order.dispute.resolution}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Link
          href={
            isBuyer ? "/dashboard/orders" : isSellerOfOrder ? "/seller/orders" : "/admin/orders"
          }
        >
          <Button variant="ghost">Back</Button>
        </Link>
      </div>
    </div>
  );
}

function DeliveryBlock({
  item,
  isBuyer,
}: {
  item: {
    id: string;
    productType: string;
    deliveredCode?: string | null;
    deliveredFileUrl?: string | null;
    externalUrl?: string | null;
    manualDeliveryNote?: string | null;
  };
  isBuyer: boolean;
}) {
  return (
    <div className="rounded-md bg-emerald-500/10 p-3 text-sm space-y-1">
      <div className="font-medium text-emerald-700 dark:text-emerald-300">Delivery</div>
      {item.productType === "LICENSE_KEY" || item.productType === "VOUCHER_CODE" ? (
        item.deliveredCode ? (
          <div className="font-mono text-base">{isBuyer ? item.deliveredCode : "••••-••••"}</div>
        ) : (
          <div className="text-muted-foreground">
            Code will appear here once delivery completes.
          </div>
        )
      ) : null}
      {item.productType === "DIGITAL_FILE" && item.deliveredFileUrl && (
        <a
          className="text-primary hover:underline"
          href={item.deliveredFileUrl}
          target="_blank"
          rel="noreferrer"
        >
          Download your file
        </a>
      )}
      {item.productType === "AFFILIATE_OFFER" && item.externalUrl && (
        <a
          className="text-primary hover:underline"
          href={item.externalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open partner offer (affiliate)
        </a>
      )}
      {item.productType === "MANUAL_DELIVERY" || item.productType === "SERVICE" ? (
        <div className="text-muted-foreground">
          Seller will deliver manually.{" "}
          {item.manualDeliveryNote ?? "Watch your messages for next steps."}
        </div>
      ) : null}
    </div>
  );
}
