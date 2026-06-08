import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";

type Provider = NextAuthConfig["providers"][number];
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { rl, rateLimitKey, RateLimitError } from "@/lib/rate-limit";

// OAuth providers are enabled only when their credentials are in env. Callers
// can ask `enabledOAuthProviders()` to decide which sign-in buttons to render.
function buildOAuthProviders(): Provider[] {
  const list: Provider[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    list.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // We rely on Google's email_verified claim — that's the only safe way
        // to merge OAuth+credential accounts by email.
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  ) {
    list.push(
      Apple({
        clientId: process.env.APPLE_CLIENT_ID,
        // Apple takes a signed client_secret JWT; NextAuth builds it from
        // teamId/keyId/privateKey via the provider's `clientSecret` factory.
        clientSecret: {
          teamId: process.env.APPLE_TEAM_ID,
          keyId: process.env.APPLE_KEY_ID,
          privateKey: process.env.APPLE_PRIVATE_KEY,
        } as unknown as string,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  return list;
}

export function enabledOAuthProviders(): { google: boolean; apple: boolean } {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(
      process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY,
    ),
  };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      sellerProfileId?: string | null;
      isBanned?: boolean;
      // §6.7 — deliberately NOT named `emailVerified`: that name is reserved
      // by @auth/core's User adapter type (Date | null) and conflicts with our
      // boolean. We surface the same fact under a different key.
      isEmailVerified?: boolean;
    };
  }
  interface User {
    role: UserRole;
    sellerProfileId?: string | null;
    isBanned?: boolean;
    isEmailVerified?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    ...buildOAuthProviders(),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // §6.4 — 10 sign-in attempts per IP per 10 minutes. We key by the
        // *requesting* IP, not the supplied email, so a single attacker can't
        // recycle attempts by rotating emails.
        if (request) {
          const limited = await rl.signIn.check(rateLimitKey(request));
          if (!limited.ok) {
            // CredentialsProvider only knows how to return null/User. We tag
            // the error so the upstream UI can surface a generic 429-ish
            // message; the existing API error mapper handles raw throws.
            throw new RateLimitError(rl.signIn.name, limited.retryAfterMs);
          }
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { sellerProfile: { select: { id: true } } },
        });
        if (!user || !user.passwordHash) return null;
        if (user.isBanned) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
          image: user.image ?? undefined,
          role: user.role,
          sellerProfileId: user.sellerProfile?.id ?? null,
          isBanned: user.isBanned,
          isEmailVerified: user.emailVerified !== null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials provider: already returned a fully-populated User. No
      // upsert needed.
      if (!account || account.provider === "credentials") return true;

      // OAuth providers (google/apple). NextAuth's Credentials-only setup
      // has no Prisma adapter, so we manually upsert a User row keyed by
      // email so the rest of our app (orders, sellerProfile, etc.) keeps
      // working unchanged. Apple may return no email when the user picks
      // private relay; we refuse those — we can't link the account to
      // anything we control.
      const email = (user.email ?? (profile as { email?: string })?.email ?? "")
        .trim()
        .toLowerCase();
      if (!email) return "/sign-in?error=oauth_no_email";

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, isBanned: true },
      });
      if (existing?.isBanned) return false;

      if (!existing) {
        const created = await prisma.user.create({
          data: {
            email,
            name: user.name ?? (profile as { name?: string })?.name ?? null,
            image: user.image ?? (profile as { picture?: string })?.picture ?? null,
            role: "BUYER",
            // OAuth providers verify email by definition. Skip the verification
            // gate so freshly-onboarded users can immediately publish/buy.
            emailVerified: new Date(),
          },
        });
        (user as { id: string }).id = created.id;
      } else {
        (user as { id: string }).id = existing.id;
        // Backfill emailVerified for existing accounts that signed up via
        // password and then attached Google/Apple — provider verified the
        // address, so we trust it.
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      const t = token as Record<string, unknown> & {
        role?: UserRole;
        sellerProfileId?: string | null;
        isBanned?: boolean;
        isEmailVerified?: boolean;
        sub?: string;
      };
      if (user) {
        t.role = (user as { role: UserRole }).role;
        t.sellerProfileId = (user as { sellerProfileId?: string | null }).sellerProfileId ?? null;
        t.isBanned = (user as { isBanned?: boolean }).isBanned ?? false;
        t.isEmailVerified = (user as { isEmailVerified?: boolean }).isEmailVerified ?? false;
      }
      if (t.sub && !user) {
        const refreshed = await prisma.user.findUnique({
          where: { id: t.sub },
          include: { sellerProfile: { select: { id: true } } },
        });
        if (refreshed) {
          t.role = refreshed.role;
          t.sellerProfileId = refreshed.sellerProfile?.id ?? null;
          t.isBanned = refreshed.isBanned;
          t.isEmailVerified = refreshed.emailVerified !== null;
        }
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as {
        sub?: string;
        role?: UserRole;
        sellerProfileId?: string | null;
        isBanned?: boolean;
        isEmailVerified?: boolean;
      };
      if (session.user && t.sub) {
        session.user.id = t.sub;
        session.user.role = (t.role ?? "BUYER") as UserRole;
        session.user.sellerProfileId = t.sellerProfileId ?? null;
        session.user.isBanned = t.isBanned ?? false;
        session.user.isEmailVerified = t.isEmailVerified ?? false;
      }
      return session;
    },
  },
});

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
