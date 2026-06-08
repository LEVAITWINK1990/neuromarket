// TZ §7.1 — CSRF / Origin check on mutating API routes.
//
// Next.js's app-router middleware runs on every matched request. We only
// enforce the Origin check for state-changing methods on /api/** routes,
// and we skip provider webhooks (which legitimately have no Origin header
// and authenticate via signature instead).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Exempt routes — webhook endpoints authenticate via provider signature /
// CRON_SECRET, never via Origin. Cron endpoints also have no UI origin.
const EXEMPT_PREFIXES = ["/api/payments/webhook/", "/api/cron/"];

function allowedOrigins(): string[] {
  const out = new Set<string>();
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL || appUrl;
  out.add(new URL(appUrl).origin);
  out.add(new URL(publicUrl).origin);
  return Array.from(out);
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (!MUTATING.has(req.method)) return NextResponse.next();
  for (const prefix of EXEMPT_PREFIXES) {
    if (pathname.startsWith(prefix)) return NextResponse.next();
  }

  // §7.1 — fall back to Referer if Origin is absent (some legacy fetchers
  // omit Origin on same-origin POSTs).
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const candidate = origin ?? (referer ? safeOrigin(referer) : null);
  const allowed = allowedOrigins();

  if (!candidate || !allowed.includes(candidate)) {
    return NextResponse.json({ error: "Forbidden origin", code: "CSRF_BLOCKED" }, { status: 403 });
  }
  return NextResponse.next();
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
