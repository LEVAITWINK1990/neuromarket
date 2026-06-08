# NeuroMarket — отчёт о готовности к production

> Анализ проекта `C:\Users\HUAWEI\Desktop\neuromarket`
> Дата: 2026-05-24
> Режим: read-only (без правок, миграций, установок)

---

## 1. Краткий вывод о зрелости

Это **технически грамотный, но не готовый к продакшну каркас** (scaffold) с амбициозным README. Архитектура и доменная модель сделаны на хорошем уровне (Prisma-схема покрывает все ключевые сущности, есть risk scoring, escrow-баланс, audit log). Но критические места, на которых держится реальный бизнес — деньги, файлы, email, идемпотентность платежей, защита от спама — **либо заглушки, либо отсутствуют**. README заявляет «production-ready», в `README.md:245-259` сам же перечисляет ключевые «known limitations», часть из которых не косметика, а блокеры.

**Зрелость: сильное MVP-демо / pre-alpha.** До реального запуска с настоящими покупателями и продавцами — несколько недель работы (см. roadmap).

---

## 2. Что уже сделано хорошо

- **Доменная модель целостная.** Prisma-схема (`prisma/schema.prisma`) покрывает users, sellers, products, digital inventory, orders, payments, commissions, payouts, reviews, disputes, reports, messages, audit log. Хорошие FK, индексы, enum'ы.
- **Чистое разделение слоёв.** `src/lib/` — чистая логика, `src/server/checkout.ts` — оркестрация, route handlers — тонкие.
- **Commission/risk math изолированы и протестированы.** `src/lib/commission.ts`, `src/lib/risk.ts`, `src/lib/inventory.ts` + ~38 unit-тестов (`tests/commission.test.ts`, `tests/risk.test.ts`, `tests/inventory.test.ts`, `tests/validation.test.ts`).
- **Идемпотентный confirmOrderPayment в транзакции** (`src/server/checkout.ts:68-195`). Повторный вызов из webhook + mock-pay безопасен.
- **Escrow-баланс продавца** (pending → available → withdrawn) реализован в БД, перемещение увязано с подтверждением доставки и разрешением спора.
- **Защита от утечки кодов**: `maskCode` (`src/lib/inventory.ts:17`), `containsSensitive` для сообщений (`src/lib/validation.ts:83-93`).
- **Risk score и moderation queue:** `src/app/api/seller/products/route.ts:43-45` автопубликует только проверенных селлеров с низким риском.
- **Audit log** последовательно пишется на всех admin-эндпоинтах (`src/lib/audit.ts`, используется в `/api/admin/*`).
- **Layout-уровень гарды:** `src/app/admin/layout.tsx`, `src/app/seller/layout.tsx`, `src/lib/guards.ts`.
- **Stripe webhook проверяет подпись** (`src/app/api/stripe/webhook/route.ts:17-24`).

---

## 3. Главные блокеры для реального запуска

### 3.1 Финансы — деньги нигде не двигаются по-настоящему

- **Выплаты селлерам — фиктивные.** `src/app/api/seller/payouts/route.ts:18-34` только переносит цифры в БД (`availableBalance → withdrawnBalance`) и создаёт запись `Payout` со статусом `REQUESTED`. Никакого Stripe Connect / банковского трансфера нет. Селлер считает, что вывел деньги, но банк ему ничего не перевёл.
- **Возвраты — только записи в БД.** `src/app/api/admin/disputes/[id]/route.ts:23-43` при `REFUND_BUYER` ставит `Order.status = REFUNDED`, но `stripe.refunds.create` нигде не вызывается (проверено grep'ом). Реальные деньги остаются у платформы.
- **Все деньги приходят на основной Stripe-аккаунт платформы.** Нет Stripe Connect, нет split-платежей. Платформа технически удерживает все средства.

### 3.2 Race condition в выдаче кодов

`src/server/checkout.ts:94-115` — find AVAILABLE, потом update. Между ними может проскочить другой webhook/mock-pay для другого заказа того же продукта. Транзакция при дефолтном Read Committed не защищает. При высокой нагрузке возможна **двойная выдача одного и того же license-кода двум покупателям**. И `createOrderForProduct` (`src/server/checkout.ts:11-62`) тоже не резервирует код — только проверяет наличие.

### 3.3 Stripe checkout рассчитан только на один товар

`src/app/api/checkout/route.ts:30-47` — берётся только `order.items[0]`. Если когда-нибудь корзина станет мульти-товарной, остальные позиции пропадут в чарже Stripe. Везде в коде стоит допущение «один товар на заказ» (например, `src/server/checkout.ts:154` `order.items[0].sellerId`).

### 3.4 Авто-завершение заказов не работает

`Order.autoCompleteAt` записывается в `src/server/checkout.ts:148`, но **в коде нет ни одного потребителя этого поля** (grep `autoCompleteAt` находит только запись). README (`README.md:57-58`) обещает «released when buyer confirms delivery or the auto-complete window passes» — вторая часть **никогда не происходит**. Деньги селлеров застревают в pending, если покупатель просто молчит.

### 3.5 NextAuth — beta

`package.json:44` — `"next-auth": "5.0.0-beta.25"`. На бете в проде сидеть нельзя — API ломается между релизами.

### 3.6 Загрузка файлов и изображений не подключена

- `Product.imageUrl` и `Product.digitalFileUrl` — обычные строки, валидируется только URL (`src/lib/validation.ts:23-26`). Селлер может вписать любую внешнюю ссылку.
- Покупатель «скачивает» файл напрямую по этой ссылке (`src/app/orders/[id]/page.tsx:187-194`) — нет проверки доступа, нет signed URL, нет ограничения утечки.
- `STORAGE_SECRET`/`STORAGE_BUCKET` в `.env.example:14-15` — заглушки, нигде не используются.
- README сам это признаёт (`README.md:247-250`).

### 3.7 Базовые security-дыры

- **Дефолтный `NEXTAUTH_SECRET = "please-change-me-in-production"`** в `.env.example:5` — если кто-то скопирует и забудет, сессии тривиально подделать.
- **Нет rate limiting нигде** (grep подтверждает) — `/api/auth/sign-up`, `/api/auth/[...nextauth]`, `/api/reports`, `/api/messages`, `/api/wishlist` спамятся.
- **Нет CSRF на кастомных JSON-роутах.** NextAuth защищает свои эндпоинты, но `/api/checkout`, `/api/admin/*`, `/api/seller/*` — нет (полагаются только на cookie SameSite).
- **Нет email-верификации и password reset** — README:251-252 подтверждает.
- **Public sign-up позволяет выбирать роль SELLER** (`src/app/api/auth/sign-up/route.ts:28-39`) — любой может стать селлером сразу, верификация добровольная.

### 3.8 Логические дыры в moderation/доставке

- **PATCH продукта не возвращает в re-moderation.** `src/app/api/seller/products/[id]/route.ts:25-65` пересчитывает risk score, но не меняет `status` на `PENDING_REVIEW`. Продавец может опубликовать чистый листинг → отредактировать в подозрительный, оставаясь PUBLISHED.
- **Seller deliver-endpoint не проверяет, что заказ оплачен.** `src/app/api/seller/order-items/[id]/deliver/route.ts:16-29` — селлер может пометить `PENDING_PAYMENT` заказ как `DELIVERED`.
- **Approve seller verification не реактивирует его pending-продукты.** `src/app/api/admin/verifications/[id]/route.ts` — после approval листинги селлера всё равно остаются `PENDING_REVIEW`, нужно вручную одобрять каждый.
- **Admin product APPROVE ставит `isVerified=true` на любой товар** (`src/app/api/admin/products/[id]/route.ts:30-32`) — даже если продавец не верифицирован. Конфликт сигналов.

---

## 4. Что нужно добавить для полноценного продукта

### 4.1 Платежи и деньги
- **Stripe Connect** (Express/Custom) для реальных payout селлерам.
- **`stripe.refunds.create`** в `src/app/api/admin/disputes/[id]/route.ts`.
- **Webhook events**: `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `payout.failed`. README (`README.md:254-256`) этот gap признаёт.
- **Tax / VAT** (Stripe Tax) — для EU/UK обязательно.
- **Auto-complete cron** — Vercel Cron / отдельный воркер, который сканирует `Order.autoCompleteAt < now()` и закрывает.

### 4.2 Storage
- UploadThing / S3 + signed URLs для `digitalFileUrl` и `imageUrl`.
- Antivirus / file scanning для загруженных файлов.

### 4.3 Auth & идентификация
- Переход на **NextAuth v5 GA**, либо откат на v4.
- Email verification (resend / SendGrid) + password reset flow.
- 2FA для админов и крупных селлеров.

### 4.4 Защита
- **Rate limiting** (Upstash Redis / Vercel KV) на sign-up, sign-in, message-send, report-submit, checkout.
- **CSRF tokens** или `Origin`-проверка на mutating JSON routes.
- Captcha на sign-up и сообщения.
- Bot detection.

### 4.5 Operational
- **Email/in-app notifications**: order paid, code delivered, dispute opened, payout requested, verification approved/rejected.
- **Observability**: Sentry + структурированные логи. Сейчас только prisma error logs (`src/lib/prisma.ts:10`).
- **Cron-инфраструктура** (Vercel Cron / Inngest / тривиальный воркер) для auto-complete, нотификаций, чистки старых сессий.
- **Backups** Postgres + restore procedure.

### 4.6 Юридическое и UX
- Terms of Service, Privacy Policy, GDPR cookie-consent. Сейчас есть только `/trust-and-safety`.
- 1099/налоговые формы для US-селлеров (если запуск в US).
- Анти-фрод сигналы (риск-скор на покупателя, а не только на листинг).

### 4.7 Архитектурные расширения
- Многотоварная корзина и multi-seller checkout (если нужно).
- Промокоды, скидки.
- Партнёрская программа (`marketplace/bundles/` сейчас **пустая папка** — задел, который пора либо реализовать, либо удалить).

---

## 5. Что нужно исправить в первую очередь

| # | Файл | Что не так | Серьёзность |
|---|------|-----------|-------------|
| 1 | `src/app/api/seller/payouts/route.ts` | Выплата — только запись в БД, не настоящая | **Critical** |
| 2 | `src/app/api/admin/disputes/[id]/route.ts` | Refund не вызывает `stripe.refunds.create` | **Critical** |
| 3 | `src/server/checkout.ts:94-115` | Race condition при выдаче кодов | **Critical** |
| 4 | `src/app/api/seller/order-items/[id]/deliver/route.ts` | Не проверяет, что заказ оплачен | High |
| 5 | `src/server/checkout.ts:148` + всё, что про `autoCompleteAt` | Поле есть, обработчика нет | High |
| 6 | `.env.example:5` + deployment guide | Дефолтный `NEXTAUTH_SECRET` | High |
| 7 | `src/app/api/seller/products/[id]/route.ts` | PATCH не возвращает в moderation | High |
| 8 | `package.json:44` | NextAuth beta | High |
| 9 | Нет middleware и нет rate-limit | Спам / brute-force / DoS | High |
| 10 | `src/app/api/checkout/route.ts:30-47` | Stripe видит только первый item | Med (пока single-item) |
| 11 | `src/app/api/admin/products/[id]/route.ts:30-32` | `isVerified=true` независимо от селлера | Med |
| 12 | `src/lib/prisma.ts` | Нет `connection pooling` config — для serverless нужен accelerator/pgbouncer | Med |

---

## 6. Что можно оставить на потом

- `marketplace/bundles/` — пустая папка, заглушка под бандлы.
- Recommendation engine (сейчас простая «similar» по категории — нормально для MVP).
- Полная локализация / мультиязычность.
- Sophisticated analytics (Recharts даёт минимум, и этого хватит на старте).
- Review replies от селлера (схема есть, UI есть, но не критично для запуска).
- Bulk-операции в админке.
- Theming/branding tools.
- Image CDN / image optimization beyond Next.js Image (Unsplash/picsum в `remotePatterns` `next.config.mjs:5-9` — это для демо, поменять при запуске).

---

## 7. Что стоит удалить, отключить или не выносить в production

- **Mock-checkout flow** (`src/app/checkout/mock/page.tsx`, `src/app/checkout/mock/mock-pay.tsx`, `src/app/api/orders/[id]/mock-pay/route.ts`). Сейчас включается, когда `stripeEnabled === false` (`src/lib/stripe.ts:5-6`). В проде если Stripe не настроен — это **дыра, через которую любой залогиненный пользователь делает заказ бесплатно**. Решение: либо удалить, либо при `NODE_ENV=production` явно возвращать 503.
- **Seed-скрипт (`prisma/seed.ts`) и `npm run db:reset`** — никогда не запускать в продакшне; в README описано как часть локального setup, но `db:reset` использует `--force` (`package.json:19`).
- **Дефолтный пароль `password123`** для seed-юзеров (`prisma/seed.ts:61`, `README.md:151`) — очевидно, ни одного из этих аккаунтов не должно быть в проде.
- **`@auth/prisma-adapter`** в `package.json:23` — установлен, но **не используется** в `src/lib/auth.ts` (там JWT-only credentials, никакого `PrismaAdapter`). Модели `Account`, `Session`, `VerificationToken` в schema есть, но всегда пустые. Либо подключить adapter, либо удалить и таблицы, и пакет.
- **Пустая папка `src/app/marketplace/bundles/`** — либо реализовать, либо убрать (сейчас даёт 404).
- **Console-логи в seed и в Prisma** (`prisma/seed.ts:9`, `src/lib/prisma.ts:10`) — заменить на структурированный логгер.
- **`unsplash.com`, `picsum.photos`, `ui-avatars.com`** в `next.config.mjs:5-9` — оставить только свой image-host.
- **`bodySizeLimit: "4mb"`** для server actions (`next.config.mjs:12-14`) — приемлемо, но как только подключается реальный upload, надо пересмотреть.

---

## 8. Roadmap: MVP → beta → production

### Этап A — реальный MVP (~1.5–2 недели, можно показывать инвестору)
1. Реальные Stripe-возвраты (`stripe.refunds.create`) в disputes (`src/app/api/admin/disputes/[id]/route.ts`).
2. Race-condition fix в выдаче кодов: либо `SERIALIZABLE` транзакция, либо `UPDATE ... WHERE status='AVAILABLE' RETURNING` с unique-claim (`src/server/checkout.ts:94`).
3. Проверка `order.status === 'PAID'` в seller deliver endpoint (`src/app/api/seller/order-items/[id]/deliver/route.ts`).
4. PATCH product → `PENDING_REVIEW` при значимых правках (`src/app/api/seller/products/[id]/route.ts`).
5. Rate limiting на public mutating endpoints.
6. Жёсткое отключение mock-checkout в `NODE_ENV=production`.
7. Замена `NEXTAUTH_SECRET` и удаление placeholder из .env.example.
8. Эмейл-верификация (один минимальный flow) + password reset.
9. Зафиксировать `NextAuth` версию (или переход на v4, или ждать v5 GA).
10. Удалить пустую `marketplace/bundles/` или подвязать редирект.

### Этап B — beta (~3–5 недель сверху, можно запускать в закрытом режиме)
1. **Stripe Connect** (Express) → реальные payout селлерам.
2. Cron auto-complete заказов (Vercel Cron / Inngest).
3. Реальное файловое хранилище (UploadThing/S3 + signed URLs) для `digitalFileUrl` и `imageUrl`.
4. Email-нотификации (order paid, dispute opened, payout processed, verification approved).
5. Webhook handlers для `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `payout.failed`.
6. Approve seller → авто-rescan + апдейт его pending-листингов (`src/app/api/admin/verifications/[id]/route.ts`).
7. CSRF protection / Origin check на mutating routes.
8. Sentry + structured logging.
9. Terms, Privacy, Cookie consent.
10. Captcha на sign-up.

### Этап C — production (~ещё 1–2 месяца)
1. Tax/VAT (Stripe Tax).
2. Анти-фрод (risk-score на покупателей, velocity-checks).
3. 2FA для админов и селлеров с большим балансом.
4. Multi-currency.
5. Полноценный observability stack (метрики, алёрты, on-call).
6. Pen-test и независимый security audit.
7. Backups + DR (disaster recovery) playbook.
8. Multi-item checkout (если нужен бизнесу) + пересмотр `commissionRecord.sellerId` логики.
9. Промокоды, бандлы, реферальная программа.
10. Замена admin actions на full audit-trail с возможностью undo.

---

## 9. Ключевые файлы и модули, на которые опираются выводы

- **Архитектура и зависимости**: `package.json`, `tsconfig.json`, `next.config.mjs`, `.env.example`
- **Доменная модель**: `prisma/schema.prisma`, `prisma/seed.ts`
- **Auth и роли**: `src/lib/auth.ts`, `src/lib/guards.ts`, `src/app/api/auth/sign-up/route.ts`, `src/app/sign-up/sign-up-form.tsx`, `src/app/admin/layout.tsx`, `src/app/seller/layout.tsx`
- **Checkout / Stripe / mock**: `src/server/checkout.ts`, `src/app/api/checkout/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/orders/[id]/mock-pay/route.ts`, `src/lib/stripe.ts`, `src/app/checkout/mock/page.tsx`
- **Деньги и финансы**: `src/lib/commission.ts`, `src/app/api/seller/payouts/route.ts`, `src/app/api/admin/disputes/[id]/route.ts`
- **Инвентарь и доставка**: `src/lib/inventory.ts`, `src/app/api/seller/order-items/[id]/deliver/route.ts`, `src/app/orders/[id]/page.tsx`
- **Listing & moderation**: `src/app/api/seller/products/route.ts`, `src/app/api/seller/products/[id]/route.ts`, `src/app/api/admin/products/[id]/route.ts`, `src/lib/risk.ts`, `src/lib/validation.ts`
- **Seller verification / payout admin**: `src/app/api/seller/verification/route.ts`, `src/app/api/admin/verifications/[id]/route.ts`
- **Reports / disputes / reviews / messages**: `src/app/api/reports/route.ts`, `src/app/api/disputes/route.ts`, `src/app/api/reviews/route.ts`, `src/app/api/messages/route.ts`
- **Admin actions / users / audit**: `src/app/api/admin/users/[id]/ban/route.ts`, `src/app/api/admin/reports/[id]/route.ts`, `src/app/admin/audit/page.tsx`, `src/lib/audit.ts`
- **Тесты**: `tests/commission.test.ts`, `tests/inventory.test.ts`, `tests/risk.test.ts`, `tests/validation.test.ts`, `e2e/marketplace.spec.ts`, `vitest.config.ts`, `playwright.config.ts`
- **README и заявленные ограничения**: `README.md` (особенно блок «Known limitations», строки 245–259)
