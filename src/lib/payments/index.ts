import { env } from "@/lib/env";
import { CryptoStubProvider } from "./crypto";
import { PaymentProvider, PaymentProviderId, ProviderError } from "./types";
import { YooKassaProvider } from "./yookassa";

export * from "./types";
export { YooKassaProvider, YOOKASSA_WEBHOOK_IPS, ipInAllowlist } from "./yookassa";
export { CryptoStubProvider } from "./crypto";

// Provider singletons keyed by id. Recreated on demand to keep tests isolated.
const cache = new Map<PaymentProviderId, PaymentProvider>();

export function getPaymentProvider(id: PaymentProviderId): PaymentProvider {
  const cached = cache.get(id);
  if (cached) return cached;

  let provider: PaymentProvider;
  switch (id) {
    case "yookassa": {
      const shopId = env.YOOKASSA_SHOP_ID;
      const secretKey = env.YOOKASSA_SECRET_KEY;
      if (!shopId || !secretKey) {
        throw new ProviderError(
          "YOOKASSA_SHOP_ID/YOOKASSA_SECRET_KEY are not set",
          "NOT_CONFIGURED",
        );
      }
      provider = new YooKassaProvider({ shopId, secretKey });
      break;
    }
    case "crypto":
      provider = new CryptoStubProvider();
      break;
    default: {
      const _exhaustive: never = id;
      throw new ProviderError(`Unknown payment provider: ${String(_exhaustive)}`, "VALIDATION");
    }
  }

  cache.set(id, provider);
  return provider;
}

/** Test-only — drop cached providers so each test gets a fresh instance. */
export function resetPaymentProviderCache(): void {
  cache.clear();
}
