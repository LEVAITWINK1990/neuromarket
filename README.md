# NeuroMarket

A Next.js 14 marketplace for legitimate AI subscriptions, SaaS licenses,
promo codes, digital access packages, and AI-related services. Verified sellers list
official licenses, valid digital vouchers, partner/affiliate offers, their own digital
AI products, setup services, and consulting packages. Buyers can browse, compare,
purchase, receive digital delivery, and resolve disputes.

> Status: under active production-hardening per `docs/IMPLEMENTATION-TZ.md`.
> The previous Stripe + mock-checkout scaffolding has been replaced by a real
> YooKassa integration behind a `PaymentProvider` abstraction; the live key is
> only consumed via env. See the [Known limitations](#known-limitations)
> section for the items still on the roadmap.

> NeuroMarket strictly does **not** support illegal resale of third-party accounts,
> stolen credentials, cracked software, shared accounts, leaked API keys, or any
> unauthorized subscription resale. See [`/trust-and-safety`](./src/app/trust-and-safety/page.tsx)
> in-app for the full policy.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** primitives (Radix UI under the hood)
- **PostgreSQL** + **Prisma ORM** (full schema covering users, sellers, products,
  digital inventory, orders, payments, commissions, reviews, disputes, messages,
  reports, payouts, and an audit log)
- **Auth.js (NextAuth v5)** with credentials provider + JWT sessions + role-based
  protected routes (Guest, Buyer, Seller, Admin)
- **YooKassa** payment provider (RUB, 54-ФЗ receipts) behind a
  `PaymentProvider` interface in `src/lib/payments/`. Sandbox keys (`test_*`)
  for dev/CI; live keys (`live_*`) only for prod (the env validator refuses a
  `test_*` key when `YOOKASSA_MODE=live`)
- **Zod** for input validation
- **Recharts** for seller/admin analytics charts
- **Vitest** for unit tests (commission math, payout, inventory assignment, risk
  scoring, validation)
- **Playwright** for end-to-end tests

## Feature overview

- Landing page with hero, search, categories, featured products, seller CTA,
  trust/safety highlights, and FAQ
- Marketplace catalog with full-text search, category/price/delivery/product-type
  filters, verified-seller-only toggle, and sort options
- Product detail page with gallery, what-you-get block, refund policy, terms,
  reviews, FAQ, smart recommendations (similar / same-seller / popular alternatives),
  buy, wishlist, compare, and a report-listing flow
- Up to 3-product side-by-side comparison (`/compare`)
- Buyer dashboard: orders, purchased digital items, downloads/access page,
  wishlist, disputes
- Seller dashboard: products CRUD, image upload, license/voucher code inventory,
  orders + manual delivery, payouts (pending / available / withdrawn), revenue
  analytics + monthly chart, verification request
- Admin panel: pending product moderation, all products/orders/users, dispute
  resolution (refund / release / reject), report queue, seller verification
  queue, and an immutable audit log
- YooKassa checkout with platform commission, IP-allowlisted webhook for
  `payment.succeeded` / `payment.canceled` / `refund.succeeded`, and full
  refund flow via the PSP API
- Digital delivery for license keys, voucher codes, digital files, manual delivery,
  and verified affiliate links — codes are masked everywhere except on the
  purchasing buyer&apos;s order page
- Escrow-style seller balances (pending → available → withdrawn), released when
  the buyer confirms delivery or the auto-complete window passes, with admin
  override via dispute resolution
- Risk scoring for listings (keywords, seller verification, price floor, report
  count, manual delivery of sensitive items). Listings above threshold require
  admin approval
- Reviews (1 per completed order, seller reply, admin hide), disputes (with
  messages), product reports, and buyer-seller messaging with credential / API
  key pattern detection on outgoing messages

---

## Local setup

### Prerequisites

- Node.js 20+ (tested on Node 22.12.0)
- npm 10+
- PostgreSQL 14+ (or use the Docker snippet below)

### 1. Install dependencies

```bash
npm install
```

### 2. Start a PostgreSQL server

For local development you can run:

```bash
docker run --name neuromarket-db \
  -e POSTGRES_USER=neuromarket \
  -e POSTGRES_PASSWORD=neuromarket \
  -e POSTGRES_DB=neuromarket \
  -p 5432:5432 -d postgres:16
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in values (the defaults work for the Docker
command above):

```bash
cp .env.example .env
```

Required keys:

| Key                          | Purpose                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`               | Postgres connection string                              |
| `NEXTAUTH_SECRET`            | Session signing secret (32+ random bytes)               |
| `NEXTAUTH_URL`               | Base URL (e.g. `http://localhost:3000`)                 |
| `APP_URL`                    | Public URL used for YooKassa `return_url` redirects     |
| `YOOKASSA_SHOP_ID`           | ShopID from ЛК ЮKassa (public, e.g. `1312608`)          |
| `YOOKASSA_SECRET_KEY`        | `test_*` for sandbox, `live_*` for production           |
| `YOOKASSA_MODE`              | `test` or `live` — must match the secret prefix in prod |
| `PLATFORM_FEE_PERCENT`       | Defaults to `10` (10% platform commission)              |
| `PROCESSING_FEE_PERCENT`     | Defaults to `2.9`                                       |
| `PROCESSING_FEE_FIXED_CENTS` | Defaults to `30`                                        |

### 4. Run migrations + seed data

```bash
npm run db:migrate    # apply prisma/migrations/*
npm run db:seed       # creates demo users, categories and products
```

The seed script creates:

- 1 admin
- 3 sellers (2 verified, 1 pending verification)
- 5 buyers
- 12 categories
- 8 published products + 1 product pending review (to demo moderation)
- 1 completed order with a review

### 5. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Seed login credentials

Every seeded user shares the same password, generated fresh on each `db:seed`
run and printed to stdout. Override with `SEED_PASSWORD=...` in the env if you
need a stable value across runs. Seed is disabled when `NODE_ENV=production`.

| Role   | Email                     |
| ------ | ------------------------- |
| Admin  | `admin@neuromarket.dev`   |
| Seller | `seller1@neuromarket.dev` |
| Seller | `seller2@neuromarket.dev` |
| Seller | `seller3@neuromarket.dev` |
| Buyer  | `buyer1@neuromarket.dev`  |
| Buyer  | `buyer2@neuromarket.dev`  |
| Buyer  | `buyer3@neuromarket.dev`  |
| Buyer  | `buyer4@neuromarket.dev`  |
| Buyer  | `buyer5@neuromarket.dev`  |

`seller3@neuromarket.dev` has a pending verification request — useful for
demoing the admin approval flow.

---

## Test, lint, and build

```bash
npm run lint        # next lint (no warnings/errors expected)
npm run typecheck   # tsc --noEmit (no errors expected)
npm run test        # vitest run (38 tests covering commission, payout, inventory, risk, validation)
npm run build       # next build (compiles + page collection)
```

End-to-end tests (require the dev/production server to be reachable):

```bash
# In one terminal
npm run build && npm run start

# In another
npm run e2e:install   # first time only — installs the Chromium browser
npm run e2e
```

---

## YooKassa configuration

NeuroMarket runs on YooKassa for fiat payments (RUB) under 54-ФЗ. The PSP
integration lives in `src/lib/payments/` behind a `PaymentProvider` interface;
a stub for a future crypto provider sits next to it (`crypto.ts`).

1. Create or open a shop in [ЛК ЮKassa](https://yookassa.ru/my). The numeric
   ShopID (e.g. `1312608`) is public — paste it into `YOOKASSA_SHOP_ID`.
2. Generate a secret key (test*\* for sandbox, live*\* for production) under
   **Настройки → Магазины → Ключи API**. Store it as `YOOKASSA_SECRET_KEY` in
   the local `.env` only — never commit it.
3. In ЛК set the webhook URL to
   `https://<your-domain>/api/payments/webhook/yookassa` and subscribe to
   `payment.succeeded`, `payment.canceled`, `refund.succeeded`.
4. YooKassa does not sign webhooks. Trust is established via IP allowlist
   (`src/lib/payments/yookassa.ts:YOOKASSA_WEBHOOK_IPS`). When deploying behind
   a proxy, make sure `x-forwarded-for` is forwarded so the allowlist sees
   the real source IP.
5. Receipt items are sent with `vat_code = 1` (без НДС — ИП on УСН/НПД/патент).
   Switch to `4` (НДС 20%) in `src/app/api/checkout/route.ts` if the legal
   entity moves to ОСНО.

The pricing math (10% platform fee + 2.9% + 30¢ processing fee) is computed
locally in [`src/lib/commission.ts`](src/lib/commission.ts) and stored in the
`CommissionRecord` table for every paid order.

---

## Project layout

```
prisma/
  schema.prisma        # Full database schema (User, Product, Order, Dispute, AuditLog, ...)
  seed.ts              # Seed admin/sellers/buyers/categories/products
src/
  app/
    page.tsx           # Landing
    marketplace/       # Catalog (search, filters, sort)
    products/[slug]/   # Product detail + actions
    compare/           # Up-to-3-product comparison
    sign-in/, sign-up/ # Auth pages
    dashboard/         # Buyer dashboard (orders, wishlist, disputes)
    orders/[id]/       # Order detail page
    seller/            # Seller dashboard (overview, products, orders, payouts, verification)
    admin/             # Admin panel (overview, products, orders, disputes, reports, verifications, audit, users)
    api/               # Route handlers (auth, checkout, webhook, seller, admin, ...)
    trust-and-safety/  # Policy page
    sellers/           # "Sell on NeuroMarket" info page
    categories/        # Category index
  components/          # Shared UI (product card, role nav, theme provider, etc.)
  lib/                 # Auth, Prisma client, payment providers, commission math, risk scoring, validation, audit log, logger, rate-limit, crypto, storage
  server/              # Server-side business logic (checkout orchestration)
tests/                 # Vitest unit tests
e2e/                   # Playwright end-to-end tests
```

---

## Known limitations

The production-hardening pass landed:

- Stripe + mock-checkout removed; YooKassa with sandbox/live modes is the only
  fiat path.
- Per-route rate limiting (in-memory by default, Upstash REST when
  `UPSTASH_REDIS_REST_URL/TOKEN` are set).
- CSRF/Origin check on all mutating `/api/**` routes via `src/middleware.ts`
  (webhooks and cron exempted, they authenticate by signature/IP/secret).
- HSTS + CSP + X-Frame-Options + Referrer-Policy + Permissions-Policy.
- Email verification + password reset (links via Resend / SMTP / console).
- Encryption at rest for license codes and payout details (AES-256-GCM with
  key rotation via `ENCRYPTION_KEYS="1:...;2:..."`).
- Storage abstraction (local FS + S3-compatible) with signed URLs for digital
  file downloads.
- Structured logging (pino) + Sentry hooks.

Still open:

- Multi-item carts are not supported — checkout takes a single `productId`.
  Carts are intentionally out of scope for v1.
- `node_modules` is tracked in git as a legacy artefact and is large; cleanup
  produces a 30k-file diff that's queued for a separate PR.
- The CSP is intentionally permissive (`unsafe-inline`/`unsafe-eval`) because
  Next.js, Tailwind, and next-auth all emit inline scripts/styles. A nonce-
  based ratchet is queued as follow-up.
- DB connection pooling (`pgbouncer`, Prisma Accelerate) is delegated to the
  `DATABASE_URL` you supply — no in-app pooler.
- Manual review of seller-uploaded files is out of scope. The risk score
  system routes anything suspicious to the admin queue but does not scan
  file contents.
