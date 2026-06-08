import { createHash, createHmac } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";

// §6.5 — storage abstraction. Three back-ends:
//   - "local": writes to ./uploads/ relative to APP_URL. Dev only.
//   - "s3":    AWS S3 / S3-compatible (Cloudflare R2, Yandex Cloud, etc.).
//             Uses SigV4 presigned GET URLs so the orderItem.deliveredFileUrl
//             does not become a permanent public link.
//
// All call sites go through {@link storage} singleton. Keys are opaque; the
// provider decides how to namespace them.

export interface StorageProvider {
  /** Returns an opaque storage key (NOT a URL). */
  put(key: string, body: Buffer, contentType?: string): Promise<string>;
  /** Returns a time-limited URL for the buyer to download the asset. */
  signedUrl(key: string, ttlSeconds: number): Promise<string>;
  /** Removes the object. No-op if absent. */
  remove(key: string): Promise<void>;
}

class LocalStorage implements StorageProvider {
  private readonly baseDir: string;
  private readonly publicBase: string;

  constructor(baseDir: string, publicBase: string) {
    this.baseDir = baseDir;
    this.publicBase = publicBase.replace(/\/$/, "");
  }

  async put(key: string, body: Buffer): Promise<string> {
    const safe = key.replace(/^\/+/, "");
    const full = path.join(this.baseDir, safe);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
    return safe;
  }

  async signedUrl(key: string, _ttlSeconds: number): Promise<string> {
    // Local back-end does not enforce TTL — dev/test only.
    return `${this.publicBase}/${key.replace(/^\/+/, "")}`;
  }

  async remove(key: string): Promise<void> {
    const full = path.join(this.baseDir, key.replace(/^\/+/, ""));
    await fs.rm(full, { force: true });
  }
}

interface S3Config {
  endpoint: string; // e.g. "https://s3.eu-central-1.amazonaws.com" or "https://storage.yandexcloud.net"
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

class S3Storage implements StorageProvider {
  constructor(private readonly cfg: S3Config) {}

  async put(key: string, body: Buffer, contentType = "application/octet-stream"): Promise<string> {
    const path = `/${this.cfg.bucket}/${encodeURI(key)}`;
    const url = `${this.cfg.endpoint}${path}`;
    const now = new Date();
    const headers = signRequest({
      method: "PUT",
      url,
      region: this.cfg.region,
      accessKey: this.cfg.accessKeyId,
      secretKey: this.cfg.secretAccessKey,
      now,
      body,
      contentType,
    });
    const res = await fetch(url, {
      method: "PUT",
      headers,
      // node-fetch / undici accept Uint8Array; TS lib.dom marks BodyInit as
      // not Buffer, hence the cast.
      body: new Uint8Array(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`S3 PUT ${key} failed: ${res.status} ${detail}`);
    }
    return key;
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    return presignGet({
      endpoint: this.cfg.endpoint,
      bucket: this.cfg.bucket,
      region: this.cfg.region,
      accessKey: this.cfg.accessKeyId,
      secretKey: this.cfg.secretAccessKey,
      key,
      ttlSeconds,
    });
  }

  async remove(key: string): Promise<void> {
    const path = `/${this.cfg.bucket}/${encodeURI(key)}`;
    const url = `${this.cfg.endpoint}${path}`;
    const now = new Date();
    const headers = signRequest({
      method: "DELETE",
      url,
      region: this.cfg.region,
      accessKey: this.cfg.accessKeyId,
      secretKey: this.cfg.secretAccessKey,
      now,
    });
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok && res.status !== 404) {
      const detail = await res.text().catch(() => "");
      throw new Error(`S3 DELETE ${key} failed: ${res.status} ${detail}`);
    }
  }
}

// ===== SigV4 helpers (minimum subset for PUT/DELETE + presigned GET) =====

function sha256Hex(input: Buffer | string): string {
  return createHash("sha256").update(input).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function signingKey(secret: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function isoDateTime(d: Date): { amzDate: string; dateStamp: string } {
  const amzDate = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

interface SignArgs {
  method: "PUT" | "DELETE";
  url: string;
  region: string;
  accessKey: string;
  secretKey: string;
  now: Date;
  body?: Buffer;
  contentType?: string;
}

function signRequest(a: SignArgs): Record<string, string> {
  const u = new URL(a.url);
  const { amzDate, dateStamp } = isoDateTime(a.now);
  const payloadHash = sha256Hex(a.body ?? Buffer.alloc(0));
  const headers: Record<string, string> = {
    host: u.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (a.contentType) headers["content-type"] = a.contentType;
  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}\n`).join("");
  const signedHeaders = sortedKeys.join(";");
  const canonicalRequest = [
    a.method,
    u.pathname,
    u.search.replace(/^\?/, ""),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${a.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = hmac(signingKey(a.secretKey, dateStamp, a.region, "s3"), stringToSign).toString(
    "hex",
  );
  headers["authorization"] =
    `AWS4-HMAC-SHA256 Credential=${a.accessKey}/${credentialScope},` +
    `SignedHeaders=${signedHeaders},Signature=${signature}`;
  return headers;
}

interface PresignArgs {
  endpoint: string;
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  key: string;
  ttlSeconds: number;
}

function presignGet(a: PresignArgs): string {
  const u = new URL(`${a.endpoint}/${a.bucket}/${encodeURI(a.key)}`);
  const now = new Date();
  const { amzDate, dateStamp } = isoDateTime(now);
  const credentialScope = `${dateStamp}/${a.region}/s3/aws4_request`;
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${a.accessKey}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(a.ttlSeconds),
    "X-Amz-SignedHeaders": "host",
  });
  // S3 expects params sorted lexicographically — URLSearchParams iterates in
  // insertion order, so build the canonical string explicitly.
  const sortedQuery = [...params.entries()]
    .sort(([a1], [b1]) => (a1 < b1 ? -1 : a1 > b1 ? 1 : 0))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const canonicalRequest = [
    "GET",
    u.pathname,
    sortedQuery,
    `host:${u.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = hmac(signingKey(a.secretKey, dateStamp, a.region, "s3"), stringToSign).toString(
    "hex",
  );
  return `${u.origin}${u.pathname}?${sortedQuery}&X-Amz-Signature=${signature}`;
}

// ===== Singleton =====

let cached: StorageProvider | null = null;

export function storage(): StorageProvider {
  if (cached) return cached;
  switch (env.STORAGE_PROVIDER) {
    case "s3":
      cached = new S3Storage({
        endpoint: env.STORAGE_S3_ENDPOINT!,
        region: env.STORAGE_S3_REGION!,
        bucket: env.STORAGE_S3_BUCKET!,
        accessKeyId: env.STORAGE_S3_ACCESS_KEY!,
        secretAccessKey: env.STORAGE_S3_SECRET_KEY!,
      });
      break;
    case "local":
    default:
      // Writes under `public/uploads/` so Next.js static handler serves the
      // files directly at `/uploads/...` without an extra route. Dev only —
      // on Vercel `public/` is read-only after build, so set STORAGE_PROVIDER=s3
      // for prod.
      cached = new LocalStorage(
        path.resolve(process.cwd(), "public", "uploads"),
        `${env.APP_URL.replace(/\/$/, "")}/uploads`,
      );
      break;
  }
  return cached;
}

/** Test-only helper. */
export function setStorageForTest(p: StorageProvider | null) {
  cached = p;
}
