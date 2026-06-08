import {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  ParsedWebhookEvent,
  ProviderError,
  RefundResult,
} from "./types";

// Stub provider — slot for the future crypto PSP. All methods throw with a
// clear "not configured" error so the type system is happy but no payment
// ever clears in this mode. See TZ \u00a72.2.
//
// When a provider is chosen (NOWPayments, Cryptomus, CryptoCloud, OxaPay,
// BTCPay Server, \u2026) replace this file with a real implementation.
export class CryptoStubProvider implements PaymentProvider {
  readonly id = "crypto" as const;

  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new ProviderError("Crypto provider is not configured yet", "NOT_CONFIGURED");
  }

  async refund(
    _providerPaymentId: string,
    _amountCents: number,
    _reason: string,
    _idempotencyKey: string,
  ): Promise<RefundResult> {
    throw new ProviderError("Crypto provider is not configured yet", "NOT_CONFIGURED");
  }

  verifyWebhook(): boolean {
    return false;
  }

  parseWebhookEvent(_rawBody: string): ParsedWebhookEvent {
    throw new ProviderError("Crypto provider is not configured yet", "NOT_CONFIGURED");
  }
}
