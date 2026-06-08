import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptString, encryptString, isEncrypted, resetCryptoCache } from "@/lib/crypto";

const ORIGINAL_KEYS = process.env.ENCRYPTION_KEYS;

describe("crypto (§6.2)", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEYS = "1:test-secret-one;2:test-secret-two";
    resetCryptoCache();
  });
  afterEach(() => {
    if (ORIGINAL_KEYS === undefined) delete process.env.ENCRYPTION_KEYS;
    else process.env.ENCRYPTION_KEYS = ORIGINAL_KEYS;
    resetCryptoCache();
  });

  it("round-trips arbitrary utf-8 strings", () => {
    for (const plain of ["NM-AAAA-1111", "license abcd-efgh", "тест 🦊 emoji"]) {
      const ct = encryptString(plain);
      expect(isEncrypted(ct)).toBe(true);
      expect(ct).not.toContain(plain);
      expect(decryptString(ct)).toBe(plain);
    }
  });

  it("uses the newest key version for encryption", () => {
    const ct = encryptString("hello");
    expect(ct.startsWith("v2:")).toBe(true);
  });

  it("decrypts ciphertext written with an older key version", () => {
    const ct = encryptString("first-key");
    process.env.ENCRYPTION_KEYS = "1:test-secret-one;2:test-secret-two;3:third-secret";
    resetCryptoCache();
    expect(decryptString(ct)).toBe("first-key");
  });

  it("throws on unknown key version", () => {
    const ct = encryptString("hi");
    process.env.ENCRYPTION_KEYS = "5:totally-different";
    resetCryptoCache();
    expect(() => decryptString(ct)).toThrow(/no key for version/);
  });

  it("throws on tampered ciphertext (GCM auth)", () => {
    const ct = encryptString("safe");
    const parts = ct.split(":");
    // Flip a single bit of the ciphertext at the byte level (not in the
    // base64 string) — flipping a base64 char near a padding boundary can
    // be a no-op since the bottom bits may decode to the same byte. Going
    // through Buffer guarantees we touch a real plaintext-deriving byte.
    const buf = Buffer.from(parts[2], "base64");
    buf[0] ^= 0x01;
    parts[2] = buf.toString("base64");
    const tampered = parts.join(":");
    expect(() => decryptString(tampered)).toThrow();
  });

  it("isEncrypted recognises legacy plaintext", () => {
    expect(isEncrypted("NM-AAAA-1111")).toBe(false);
    expect(isEncrypted(encryptString("x"))).toBe(true);
  });
});
