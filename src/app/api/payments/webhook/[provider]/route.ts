import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider, ProviderError } from "@/lib/payments";
import type { PaymentProviderId } from "@/lib/payments";
import { confirmOrderPayment } from "@/server/checkout";
import { finalizeRefundSucceeded } from "@/server/refunds";

const KNOWN_PROVIDERS: PaymentProviderId[] = ["yookassa", "crypto"];

function isKnownProvider(id: string): id is PaymentProviderId {
  return (KNOWN_PROVIDERS as string[]).includes(id);
}

function clientIpFromRequest(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

export async function POST(req: Request, { params }: { params: { provider: string } }) {
  if (!isKnownProvider(params.provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const provider = getPaymentProvider(params.provider);
  const rawBody = await req.text();
  const verified = provider.verifyWebhook({
    headers: req.headers,
    ip: clientIpFromRequest(req),
    rawBody,
  });
  if (!verified) {
    return NextResponse.json({ error: "Untrusted webhook source" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = provider.parseWebhookEvent(rawBody);
  } catch (err) {
    if (err instanceof ProviderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // Idempotency — record-or-skip on the unique (providerId, providerEventId)
  // index. If we already saw this event we return ok without re-processing.
  try {
    await prisma.webhookEvent.create({
      data: {
        providerId: provider.id,
        providerEventId: parsed.providerEventId,
        eventType: parsed.eventType,
        payload: parsed.raw as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true, deduplicated: true });
    }
    throw err;
  }

  try {
    if (parsed.eventType === "payment.succeeded" && parsed.providerPaymentId) {
      const payment = await prisma.payment.findUnique({
        where: { providerPaymentId: parsed.providerPaymentId },
        select: { orderId: true },
      });
      if (!payment) {
        await markEventFailed(parsed.providerEventId, "Payment row not found");
        return NextResponse.json({ ok: false, reason: "payment-not-found" }, { status: 200 });
      }
      const amount = parsed.amountCents;
      const currency = parsed.currency;
      if (amount === undefined || !currency) {
        await markEventFailed(parsed.providerEventId, "Missing amount/currency");
        return NextResponse.json({ ok: false, reason: "missing-amount" }, { status: 200 });
      }
      await confirmOrderPayment(payment.orderId, {
        providerId: provider.id,
        providerPaymentId: parsed.providerPaymentId,
        paidAmountCents: amount,
        paidCurrency: currency,
      });
    } else if (parsed.eventType === "payment.canceled" && parsed.providerPaymentId) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: parsed.providerPaymentId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    } else if (parsed.eventType === "refund.succeeded" && parsed.providerRefundId) {
      const amount = parsed.amountCents;
      if (amount === undefined) {
        await markEventFailed(parsed.providerEventId, "refund missing amount");
        return NextResponse.json({ ok: false, reason: "missing-amount" }, { status: 200 });
      }
      await finalizeRefundSucceeded({
        providerRefundId: parsed.providerRefundId,
        amountCents: amount,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown processing error";
    await markEventFailed(parsed.providerEventId, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  await prisma.webhookEvent.updateMany({
    where: { providerId: provider.id, providerEventId: parsed.providerEventId, processedAt: null },
    data: { processedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

async function markEventFailed(providerEventId: string, error: string) {
  await prisma.webhookEvent.updateMany({
    where: { providerEventId },
    data: { processingError: error, processedAt: new Date() },
  });
}
