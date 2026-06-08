import {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  ParsedWebhookEvent,
  ProviderError,
  ProviderPaymentStatus,
  ProviderWebhookEventType,
  RefundResult,
} from "./types";

// YooKassa is whitelisted-by-IP rather than signed (TZ §4.4). The list below is
// from https://yookassa.ru/developers/using-api/webhooks#ip ; check the docs
// quarterly to keep it current.
export const YOOKASSA_WEBHOOK_IPS: ReadonlyArray<string> = Object.freeze([
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11",
  "77.75.156.35",
  "77.75.154.128/25",
  "2a02:5180:0:1509::/64",
  "2a02:5180:0:2655::/64",
  "2a02:5180:0:1533::/64",
  "2a02:5180:0:2669::/64",
]);

const PROVIDER_ID = "yookassa" as const;
const API_BASE_URL = "https://api.yookassa.ru/v3";

function centsToRubString(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) {
    throw new ProviderError("amountCents must be a non-negative integer", "VALIDATION");
  }
  // YooKassa demands a string with exactly two decimal places. We deliberately
  // do not use toLocaleString because that injects locale-specific separators.
  return (cents / 100).toFixed(2);
}

function mapPaymentStatus(s: string | undefined): ProviderPaymentStatus {
  switch (s) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "canceled";
    case "pending":
    case "waiting_for_capture":
      return "pending";
    default:
      return "pending";
  }
}

function mapRefundStatus(s: string | undefined): RefundResult["status"] {
  switch (s) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "canceled";
    default:
      return "pending";
  }
}

function mapEventType(event: string | undefined): ProviderWebhookEventType {
  switch (event) {
    case "payment.succeeded":
    case "payment.canceled":
    case "payment.waiting_for_capture":
    case "refund.succeeded":
      return event;
    default:
      return "unknown";
  }
}

/** Pure helper exported for tests — checks ip against the CIDR allowlist. */
export function ipInAllowlist(
  ip: string | null | undefined,
  list: ReadonlyArray<string> = YOOKASSA_WEBHOOK_IPS,
): boolean {
  if (!ip) return false;
  const candidate = ip.trim();
  if (!candidate) return false;
  for (const entry of list) {
    if (!entry.includes("/")) {
      if (entry === candidate) return true;
      continue;
    }
    if (cidrContains(entry, candidate)) return true;
  }
  return false;
}

function cidrContains(cidr: string, ip: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  if (!Number.isFinite(bits)) return false;
  const isV6 = range.includes(":");
  if (isV6 !== ip.includes(":")) return false;
  if (isV6) return ipv6InCidr(range, ip, bits);
  return ipv4InCidr(range, ip, bits);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function ipv4InCidr(rangeIp: string, targetIp: string, bits: number): boolean {
  const range = ipv4ToInt(rangeIp);
  const target = ipv4ToInt(targetIp);
  if (range === null || target === null) return false;
  if (bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (0xffffffff << (32 - bits)) >>> 0;
  return (range & mask) === (target & mask);
}

function ipv6ToBigInt(ip: string): bigint | null {
  const sides = ip.split("::");
  if (sides.length > 2) return null;
  const leftRaw = sides[0] ? sides[0].split(":") : [];
  const rightRaw = sides.length === 2 ? (sides[1] ? sides[1].split(":") : []) : [];
  const groups: string[] = [];
  for (const g of leftRaw) groups.push(g);
  const missing = 8 - leftRaw.length - rightRaw.length;
  if (sides.length === 2) {
    if (missing < 0) return null;
    for (let i = 0; i < missing; i++) groups.push("0");
  }
  for (const g of rightRaw) groups.push(g);
  if (groups.length !== 8) return null;
  let n = 0n;
  for (const g of groups) {
    if (g.length > 4) return null;
    const v = parseInt(g || "0", 16);
    if (!Number.isFinite(v) || v < 0 || v > 0xffff) return null;
    n = (n << 16n) | BigInt(v);
  }
  return n;
}

function ipv6InCidr(rangeIp: string, targetIp: string, bits: number): boolean {
  const range = ipv6ToBigInt(rangeIp);
  const target = ipv6ToBigInt(targetIp);
  if (range === null || target === null) return false;
  if (bits < 0 || bits > 128) return false;
  if (bits === 0) return true;
  const mask = ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - bits)) - 1n);
  return (range & mask) === (target & mask);
}

interface YooKassaApiPayment {
  id: string;
  status?: string;
  confirmation?: { confirmation_url?: string; type?: string };
}

interface YooKassaApiRefund {
  id: string;
  status?: string;
}

interface YooKassaApiError {
  description?: string;
  code?: string;
  type?: string;
}

export interface YooKassaProviderConfig {
  shopId: string;
  secretKey: string;
  /** Override webhook IP allowlist (testing only). */
  webhookIps?: ReadonlyArray<string>;
  /** Override base URL (testing only). */
  baseUrl?: string;
  /** Override fetch (testing only). */
  fetchImpl?: typeof fetch;
}

export class YooKassaProvider implements PaymentProvider {
  readonly id = PROVIDER_ID;
  private readonly authHeader: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly allowlist: ReadonlyArray<string>;

  constructor(config: YooKassaProviderConfig) {
    if (!config.shopId || !config.secretKey) {
      throw new ProviderError(
        "YooKassa not configured (missing shopId/secretKey)",
        "NOT_CONFIGURED",
      );
    }
    const token = Buffer.from(`${config.shopId}:${config.secretKey}`, "utf8").toString("base64");
    this.authHeader = `Basic ${token}`;
    this.baseUrl = (config.baseUrl ?? API_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.allowlist = config.webhookIps ?? YOOKASSA_WEBHOOK_IPS;
  }

  private async request<T>(
    method: "POST" | "GET",
    path: string,
    idempotencyKey: string | undefined,
    body: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: "application/json",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (idempotencyKey) headers["Idempotence-Key"] = idempotencyKey;

    const url = `${this.baseUrl}${path}`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      throw new ProviderError(
        err instanceof Error ? err.message : "YooKassa request failed",
        "NETWORK",
        err,
      );
    }

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // fall through
      }
    }

    if (!response.ok) {
      const apiErr = (parsed ?? {}) as YooKassaApiError;
      throw new ProviderError(
        `${apiErr.description ?? "YooKassa HTTP " + response.status}` +
          (apiErr.code ? ` (yookassa code: ${apiErr.code})` : ""),
        response.status === 401 || response.status === 403 ? "AUTH" : "NETWORK",
        { httpStatus: response.status, yookassa: apiErr },
      );
    }
    return parsed as T;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (input.currency !== "RUB") {
      throw new ProviderError(`YooKassa only supports RUB, got ${input.currency}`, "VALIDATION");
    }

    const items = input.receiptItems.map((item) => ({
      description: item.description.slice(0, 128),
      quantity: item.quantity.toFixed(2),
      amount: { value: centsToRubString(item.amountCents), currency: "RUB" },
      vat_code: item.vatCode,
      payment_subject: item.paymentSubject ?? "service",
      payment_mode: item.paymentMode ?? "full_payment",
    }));

    const payload = {
      amount: { value: centsToRubString(input.amountCents), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: input.returnUrl },
      description: input.description.slice(0, 128),
      metadata: { orderId: input.orderId, buyerId: input.buyerId },
      receipt: {
        customer: { email: input.buyerEmail },
        email: input.buyerEmail,
        items,
      },
    };

    const payment = await this.request<YooKassaApiPayment>(
      "POST",
      "/payments",
      input.idempotencyKey,
      payload,
    );
    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      throw new ProviderError("YooKassa did not return a confirmation_url", "VALIDATION");
    }
    return {
      providerPaymentId: payment.id,
      confirmationUrl,
      status: mapPaymentStatus(payment.status),
    };
  }

  async refund(
    providerPaymentId: string,
    amountCents: number,
    reason: string,
    idempotencyKey: string,
  ): Promise<RefundResult> {
    const payload = {
      payment_id: providerPaymentId,
      amount: { value: centsToRubString(amountCents), currency: "RUB" },
      description: reason.slice(0, 250),
    };
    const refund = await this.request<YooKassaApiRefund>(
      "POST",
      "/refunds",
      idempotencyKey,
      payload,
    );
    return {
      providerRefundId: refund.id,
      status: mapRefundStatus(refund.status),
    };
  }

  verifyWebhook(req: { headers: Headers; ip?: string | null; rawBody: string }): boolean {
    // YooKassa does not sign webhooks — trust is established via IP allowlist.
    if (req.ip && ipInAllowlist(req.ip, this.allowlist)) return true;

    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first && ipInAllowlist(first, this.allowlist)) return true;
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp && ipInAllowlist(realIp.trim(), this.allowlist)) return true;

    return false;
  }

  parseWebhookEvent(rawBody: string): ParsedWebhookEvent {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new ProviderError("Webhook body is not valid JSON", "VALIDATION");
    }
    const body = parsed as {
      event?: string;
      object?: {
        id?: string;
        amount?: { value?: string; currency?: string };
        metadata?: Record<string, string>;
        payment_id?: string;
      };
      type?: string;
    };

    const obj = body.object ?? {};
    const eventType = mapEventType(body.event);
    const amountValue = obj.amount?.value;
    const amountCents = amountValue ? Math.round(parseFloat(amountValue) * 100) : undefined;
    const isRefund = eventType.startsWith("refund.");

    // YooKassa events do not have a top-level event id — we synthesise one from
    // (event, object.id) which is unique per event delivery.
    const providerEventId = `${body.event ?? "unknown"}:${obj.id ?? "noid"}`;

    return {
      providerEventId,
      eventType,
      providerPaymentId: isRefund ? obj.payment_id : obj.id,
      providerRefundId: isRefund ? obj.id : undefined,
      amountCents,
      currency: obj.amount?.currency,
      metadata: obj.metadata,
      raw: parsed,
    };
  }
}
