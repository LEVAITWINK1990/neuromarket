// Payment provider contract. Each PSP (YooKassa today, crypto tomorrow)
// implements PaymentProvider. The checkout / webhook / refund routes only see
// this interface — no provider-specific code leaks into the application layer.
//
// See TZ \u00a73.

export type PaymentProviderId = "yookassa" | "crypto";

export interface ReceiptItem {
  description: string;
  quantity: number;
  amountCents: number;
  /**
   * 54-FZ vat_code:
   *   1 — without VAT (ИП on УСН/НПД/патент — neuromarket default)
   *   2 — 0%, 3 — 10%, 4 — 20%, 5 — 10/110, 6 — 20/120
   */
  vatCode: number;
  /** YooKassa payment_subject; safe default "service". */
  paymentSubject?: "service" | "commodity" | "intellectual_activity";
  /** YooKassa payment_mode; safe default "full_payment". */
  paymentMode?: "full_payment" | "full_prepayment" | "partial_prepayment";
}

export interface CreatePaymentInput {
  orderId: string;
  amountCents: number;
  currency: "RUB";
  description: string;
  returnUrl: string;
  buyerEmail: string;
  buyerId: string;
  /** Receipt for 54-FZ; one entry per OrderItem. */
  receiptItems: ReceiptItem[];
  /** Idempotence key — stable per checkout attempt. */
  idempotencyKey: string;
}

export type ProviderPaymentStatus = "pending" | "succeeded" | "canceled" | "failed";

export interface CreatePaymentResult {
  providerPaymentId: string;
  /** URL the buyer must be redirected to. */
  confirmationUrl: string;
  status: ProviderPaymentStatus;
}

export interface RefundResult {
  providerRefundId: string;
  status: "pending" | "succeeded" | "canceled";
}

export type ProviderWebhookEventType =
  | "payment.succeeded"
  | "payment.canceled"
  | "payment.waiting_for_capture"
  | "refund.succeeded"
  | "refund.canceled"
  | "unknown";

export interface ParsedWebhookEvent {
  /** Provider-assigned event id; used for idempotency. */
  providerEventId: string;
  eventType: ProviderWebhookEventType;
  providerPaymentId?: string;
  providerRefundId?: string;
  amountCents?: number;
  currency?: string;
  metadata?: Record<string, string>;
  raw: unknown;
}

/**
 * Errors thrown by providers — use ProviderError so the API layer can map to
 * an HTTP status without exposing internals.
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "AUTH"
      | "VALIDATION"
      | "NETWORK"
      | "SIGNATURE"
      | "NOT_CONFIGURED"
      | "UNKNOWN" = "UNKNOWN",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  refund(
    providerPaymentId: string,
    amountCents: number,
    reason: string,
    idempotencyKey: string,
  ): Promise<RefundResult>;
  /**
   * Verify a webhook request is genuinely from this provider. YooKassa does
   * not sign webhooks — instead it ships from a fixed IP allowlist (see
   * yookassa.ts). Implementations must enforce that allowlist here.
   */
  verifyWebhook(req: { headers: Headers; ip?: string | null; rawBody: string }): boolean;
  parseWebhookEvent(rawBody: string): ParsedWebhookEvent;
}
