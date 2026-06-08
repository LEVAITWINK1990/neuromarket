import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { env } from "@/lib/env";

// §6.2 — symmetric encryption for application-layer fields that must not be
// readable from a DB dump. We use AES-256-GCM with a per-record random 12-byte
// nonce, encoded into a single string with a version prefix so the key can be
// rotated by adding a new entry to {@link KEY_RING}.
//
// Format on disk:   v<version>:<base64url(nonce)>:<base64url(ciphertext)>:<base64url(authTag)>
// Example:          v1:abc...:xyz...:def...
//
// Plaintext is utf-8 strings only. For binary payloads, base64 first.

const ALGO = "aes-256-gcm";

interface KeyMaterial {
  version: number;
  key: Buffer;
}

let cachedRing: KeyMaterial[] | null = null;

function deriveKey(secret: string, salt: string): Buffer {
  // scrypt with a deterministic salt — we never store the salt because the
  // secret itself is high-entropy and per-deployment. This is a stretched KDF
  // not a password hash; we accept that anyone with ENCRYPTION_KEYS can derive
  // the same key.
  return scryptSync(secret, salt, 32);
}

function loadKeyRing(): KeyMaterial[] {
  if (cachedRing) return cachedRing;
  const raw = process.env.ENCRYPTION_KEYS;
  if (!raw) {
    if (env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEYS is required in production (TZ §6.2)");
    }
    // Dev fallback so local boot works without any setup. NEVER reuse this in prod.
    cachedRing = [{ version: 1, key: deriveKey("dev-only-fallback", "neuromarket") }];
    return cachedRing;
  }
  // Format: "1:<secret1>;2:<secret2>" — newest version highest. We always
  // encrypt with the highest version.
  cachedRing = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx < 0) throw new Error(`Invalid ENCRYPTION_KEYS entry: ${entry}`);
      const version = Number(entry.slice(0, idx));
      const secret = entry.slice(idx + 1);
      if (!Number.isInteger(version) || version < 1 || !secret) {
        throw new Error(`Invalid ENCRYPTION_KEYS entry: ${entry}`);
      }
      return { version, key: deriveKey(secret, `neuromarket:v${version}`) };
    })
    .sort((a, b) => b.version - a.version);
  if (cachedRing.length === 0) {
    throw new Error("ENCRYPTION_KEYS parsed to empty ring");
  }
  return cachedRing;
}

/** Test-only helper to reset the in-memory ring after env mutation. */
export function resetCryptoCache() {
  cachedRing = null;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function encryptString(plain: string): string {
  const ring = loadKeyRing();
  const current = ring[0];
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALGO, current.key, nonce);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v${current.version}:${b64url(nonce)}:${b64url(ct)}:${b64url(tag)}`;
}

export function decryptString(encoded: string): string {
  const ring = loadKeyRing();
  const parts = encoded.split(":");
  if (parts.length !== 4) throw new Error("decryptString: malformed ciphertext");
  const versionStr = parts[0];
  if (!versionStr.startsWith("v")) throw new Error("decryptString: missing version prefix");
  const version = Number(versionStr.slice(1));
  const km = ring.find((k) => k.version === version);
  if (!km) throw new Error(`decryptString: no key for version v${version}`);
  const nonce = fromB64url(parts[1]);
  const ct = fromB64url(parts[2]);
  const tag = fromB64url(parts[3]);
  const decipher = createDecipheriv(ALGO, km.key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Returns true if the value looks like our encrypted format (`v<n>:...`). */
export function isEncrypted(value: string): boolean {
  return /^v\d+:/.test(value);
}
