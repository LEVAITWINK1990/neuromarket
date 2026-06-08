import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import { ApiError } from "@/lib/api-error";

/**
 * Server-component / page-level guard. Redirects when:
 *   - no session → /sign-in
 *   - session.user.isBanned → /banned (force sign-out first)
 *
 * Note: `auth.ts` re-reads `isBanned` from the DB on every request via the
 * jwt callback, so this picks up a freshly-banned user without waiting for
 * the JWT to expire.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.isBanned) {
    try {
      await signOut({ redirect: false });
    } catch {
      // signOut throws NEXT_REDIRECT in some next-auth versions; swallow.
    }
    redirect("/banned");
  }
  return session;
}

/**
 * Role-gated page-level guard. Use in admin / seller layouts.
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireSession();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role)) redirect("/");
  return session;
}

/**
 * API-route guard. Throws {@link ApiError} instead of redirecting.
 *   - 401 if no session
 *   - 403 if account is banned
 *
 * Route handlers should `try { ... } catch (e) { return toApiResponse(e); }`
 * — see `src/lib/api-error.ts`.
 */
export async function requireApiSession() {
  const session = await auth();
  if (!session?.user) throw new ApiError(401, "Unauthorized");
  if (session.user.isBanned) throw new ApiError(403, "Account banned", "ACCOUNT_BANNED");
  return session;
}

/** API-route guard with role check. */
export async function requireApiRole(role: UserRole | UserRole[]) {
  const session = await requireApiSession();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role)) {
    throw new ApiError(403, "Forbidden", "ROLE_FORBIDDEN");
  }
  return session;
}

/**
 * API-route guard that ALSO requires `emailVerified !== null`. Use for
 * money-moving / publishing actions (TZ §6.7): creating an order, posting
 * a product, opening a dispute, etc. Read-only routes should NOT call this
 * — buyers should still be able to browse before verifying their email.
 *
 * The flag is populated from the JWT (see `src/lib/auth.ts`); a stale JWT
 * is auto-refreshed in the jwt callback, so a user who just clicked the
 * verification link can proceed without re-logging in.
 */
export async function requireApiVerifiedEmailSession() {
  const session = await requireApiSession();
  if (!session.user.isEmailVerified) {
    throw new ApiError(403, "Email verification required for this action", "EMAIL_NOT_VERIFIED");
  }
  return session;
}

/**
 * API-route guard requiring a verified seller. Checks both account-level
 * isBanned and SellerProfile.isBanned via fresh DB read.
 *
 * @param options.requireVerifiedEmail — when true (default false), also
 *   require `emailVerified !== null`. Use for product create / publish /
 *   payout request / any seller-side mutation. Listing your own products
 *   doesn't need this.
 */
export async function requireApiSellerSession(options: { requireVerifiedEmail?: boolean } = {}) {
  const session = await requireApiSession();
  if (!session.user.sellerProfileId) {
    throw new ApiError(403, "Seller profile required", "NO_SELLER_PROFILE");
  }
  if (options.requireVerifiedEmail && !session.user.isEmailVerified) {
    throw new ApiError(403, "Email verification required for this action", "EMAIL_NOT_VERIFIED");
  }
  // Cheap fresh check on SellerProfile.isBanned (separate from user.isBanned).
  const { prisma } = await import("@/lib/prisma");
  const sp = await prisma.sellerProfile.findUnique({
    where: { id: session.user.sellerProfileId },
    select: { isBanned: true },
  });
  if (sp?.isBanned) {
    throw new ApiError(403, "Seller account banned", "SELLER_BANNED");
  }
  return session;
}
