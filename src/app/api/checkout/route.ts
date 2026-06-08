import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider, ProviderError } from "@/lib/payments";
import type { PaymentProviderId, ReceiptItem } from "@/lib/payments";
import { createOrderForProduct } from "@/server/checkout";
import { requireApiVerifiedEmailSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { rl, rateLimitKey, requireRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.string().min(1),
  provider: z.enum(["yookassa", "crypto"]).default("yookassa"),
});

// 54-FZ vat_code. NeuroMarket default: 1 — without VAT (ИП on УСН/НПД/патент).
// Confirmed with user 2026-05-24. Switch to 4 (НДС 20%) if the legal entity
// moves to ОСНО.
const DEFAULT_VAT_CODE = 1;

export async function POST(req: Request) {
  try {
    // §6.7 — checkout is a money-moving action; require verified email.
    const session = await requireApiVerifiedEmailSession();
    if (!session.user.email) {
      throw new ApiError(400, "An email address is required to check out");
    }
    // §6.4 — 20 checkout starts per (IP+userId) per hour.
    await requireRateLimit(rl.checkout, rateLimitKey(req, session.user.id));

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid request");

    const providerId: PaymentProviderId = parsed.data.provider;

    if (providerId === "crypto") {
      throw new ApiError(400, "Crypto payment is coming soon. Choose YooKassa for now.");
    }

    let order;
    try {
      order = await createOrderForProduct(session.user.id, parsed.data.productId);
    } catch (err) {
      throw new ApiError(400, err instanceof Error ? err.message : "Could not start checkout");
    }

    // Reuse an in-flight Payment for this order to keep YooKassa happy and avoid
    // creating duplicate confirmation URLs. See TZ §3.4.
    const existing = await prisma.payment.findUnique({ where: { orderId: order.id } });
    if (
      existing?.confirmationUrl &&
      existing.status === "PENDING" &&
      existing.providerId === providerId
    ) {
      return NextResponse.json({ orderId: order.id, checkoutUrl: existing.confirmationUrl });
    }

    const idempotencyKey = existing?.idempotencyKey ?? randomUUID();
    const receiptItems: ReceiptItem[] = order.items.map((item) => ({
      description: item.title,
      quantity: item.quantity,
      amountCents: item.priceCents * item.quantity,
      vatCode: DEFAULT_VAT_CODE,
    }));

    const returnUrl = `${env.APP_URL.replace(/\/$/, "")}/orders/${order.id}`;

    const provider = getPaymentProvider(providerId);
    let providerResult;
    try {
      providerResult = await provider.createPayment({
        orderId: order.id,
        amountCents: order.totalCents,
        currency: "RUB",
        description: `NeuroMarket order ${order.id}`,
        returnUrl,
        buyerEmail: session.user.email,
        buyerId: session.user.id,
        receiptItems,
        idempotencyKey,
      });
    } catch (err) {
      if (err instanceof ProviderError) {
        const status = err.code === "NOT_CONFIGURED" ? 503 : 502;
        throw new ApiError(status, `Payment provider: ${err.message}`, err.code);
      }
      throw err;
    }

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        providerId,
        providerPaymentId: providerResult.providerPaymentId,
        idempotencyKey,
        buyerId: session.user.id,
        buyerEmail: session.user.email,
        confirmationUrl: providerResult.confirmationUrl,
        currency: "RUB",
        status:
          providerResult.status === "succeeded"
            ? "SUCCEEDED"
            : providerResult.status === "canceled"
              ? "FAILED"
              : "PENDING",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: providerResult.confirmationUrl,
    });
  } catch (err) {
    return toApiResponse(err);
  }
}
