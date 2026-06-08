import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";

// Admin-only multipart upload (product images + future asset attachments).
// Sellers use a different path; this endpoint deliberately bypasses
// verification gates and risk scoring because the admin is the one moderating.

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PREFIXES = ["image/"];
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(req: Request) {
  try {
    await requireApiRole("ADMIN");
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "Missing file field");
    }
    if (file.size === 0) throw new ApiError(400, "Empty file");
    if (file.size > MAX_BYTES) throw new ApiError(413, "File exceeds 5MB limit");
    if (!ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))) {
      throw new ApiError(415, "Only images are allowed");
    }
    const ext = EXT_BY_MIME[file.type] ?? "bin";
    const key = `products/${randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await storage().put(key, buf, file.type);
    const url = await storage().signedUrl(key, 60 * 60 * 24 * 365 * 10);
    logger.info({ where: "admin.upload", key, size: file.size, type: file.type }, "uploaded");
    return NextResponse.json({ ok: true, url, key });
  } catch (err) {
    return toApiResponse(err);
  }
}
