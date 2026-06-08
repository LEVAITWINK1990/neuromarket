# Current Work — Admin Product Publishing + Multi-Provider Sign-In

> **Что это за документ.** Скоуп активной работы (после мерджа PR #1 в `main`).
> Каждая нейронка / разработчик, открывающий этот файл, должен:
>
> 1. Прочитать чеклист — что уже сделано, что в работе, что pending.
> 2. Прочитать **HANDOFF NOTES** в конце — там точка остановки и что **не** надо переделывать.
> 3. Обновить чеклист и handoff notes ПЕРЕД каждым коммитом.
>
> Старый `IMPLEMENTATION-TZ.md` (10-фазная prod hardening) выполнен и смерджен
> в `main` (см. merge-commit `f65f009`). При необходимости текст:
> `git show f65f009:docs/IMPLEMENTATION-TZ.md`.

## Цели

1. **Фикс крэша `/admin/payouts`** — pino-pretty transport ломает Next.js server components.
2. **Cleanup** — убрать leftover «Seeded logins / password123» подсказку с `/sign-in`.
3. **Admin может публиковать продукты сам** — отдельная страница `/admin/products/new` + API. Не трогаем seller-flow. Картинки загружаются файлом (storage абстракция уже есть из Phase 7).
4. **OAuth провайдеры** — Google, Apple/iCloud, plus email/password (последнее уже работает). Цель: пользователь видит на `/sign-in` кнопки «Continue with Google», «Continue with Apple».

## Чеклист

### Block A — fix logger + cleanup sign-in (commit `ebe18435`)

- [x] `src/lib/logger.ts` — убран `transport: { target: "pino-pretty" }`. В Next.js worker-thread транспорт пино не работает (бандлер не находит pino-pretty файл), что вызывало `Error: default level: must be included in custom levels` при импорте логгера в server-компонент (`/admin/payouts` падал).
- [x] `src/app/sign-in/page.tsx` — удалена строка «Seeded logins: admin@neuromarket.dev … password password123». Seed-данные остаются в `prisma/seed.ts` для локалки, но не палятся в UI.

### Block B — current work tracking doc (this commit)

- [x] Удалить старый `docs/IMPLEMENTATION-TZ.md`.
- [x] Создать `docs/CURRENT-WORK.md` (этот файл) с чеклистом и handoff notes.

### Block C — admin product publishing

- [x] `src/lib/storage.ts` — LocalStorage пишет теперь в `public/uploads/` (Next.js auto-serves под `/uploads/*`). В prod рекомендуем `STORAGE_PROVIDER=s3`.
- [x] `.gitignore` — добавлен `public/uploads`.
- [x] `src/app/api/admin/upload/route.ts` — POST multipart, admin-only, 5MB лимит, только image/\*, отдаёт `{ url, key }`.
- [x] `src/app/api/admin/products/route.ts` — POST, admin-only. Авто-создаёт SellerProfile для админа (verificationStatus=APPROVED), создаёт Product со status=PUBLISHED, isVerified=true, isModerated=true (минует risk-score и review). Использует тот же `productInputSchema`.
- [x] `src/app/seller/products/product-form.tsx` — рефактор: новые опциональные пропсы `createEndpoint`, `updateEndpointBase`, `uploadEndpoint`, `redirectPath`, `submitLabel`, `hideReviewNotice`. UI загрузки картинки (input type=file + preview) включается когда передан `uploadEndpoint`. Поведение seller-флоу не меняется (defaults).
- [x] `src/app/admin/products/new/page.tsx` — страница «New product» под `/admin/products/new`. Использует общий `ProductForm` с админ-эндпоинтами.
- [x] `src/app/admin/products/page.tsx` — добавлена кнопка «+ Add product» (ссылка на `/admin/products/new`).
- [x] `npm run lint && npm run typecheck && npm test && npm run build` — clean (91/91 тестов).
- [x] Block C committed.

### Block D — OAuth: Google + Apple (commit pending)

Решение: `@auth/prisma-adapter` НЕ понадобился — проект на JWT strategy и имеет богатые обязанности по User (sellerProfile, isBanned, emailVerified). Переход на database-session сломал бы все это. Вместо адаптера в `signIn` callback вручную upsertим User по email (Google/Apple верифицируют email, линк-бай-email безопасен).

Электронная почта: было спрошено «по почте». Email/password вход в NextAuth Credentials provider уже работает и на /sign-in. Magic-link «войти по ссылке без пароля» оставили как opt-in на будущее (требует EmailVerificationToken рефактор + новый endpoint, не критично для владельца).

- [x] `src/lib/env.ts` — добавлены optional env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`.
- [x] `.env.example` — задокументированы URL'ы и шаги (Google Console, Apple Developer).
- [x] `src/lib/auth.ts` — добавлены `Google` и `Apple` providers через `buildOAuthProviders()` (включаются только если credentials в env). Экспорт `enabledOAuthProviders()` для UI. `signIn` callback upsertит User по email, выставляет emailVerified=now, блокирует banned.
- [x] `src/app/sign-in/sign-in-form.tsx` — кнопки «Continue with Google» / «Continue with Apple» (показываются только когда provider enabled). SVG-глифы inline. `or sign in with email` делимитер между OAuth и парольным входом.
- [x] `src/app/sign-in/page.tsx` — серверно читаем `enabledOAuthProviders()` и прокидываем в форму.
- [x] `npm run lint && typecheck && test && build` — clean (91/91).

### Block E — testing

- [x] `npm run lint && npm run typecheck && npm test && npm run build` — clean (91/91, build green) on a fresh checkout from a stock `.env.example`-derived `.env`.
- [x] **Найден и исправлен баг (`fix(logger): treat empty LOG_LEVEL env var as unset`, commit `f4d107a8`)**: `.env.example` шипит с `LOG_LEVEL=""`. После `cp .env.example .env` пустая строка дотекала до `pino({ level: "" })` (потому что `??` пропускает только `null/undefined`, а не пустую строку), и любой server-side роут, импортирующий `src/lib/logger.ts`, падал с `Error: default level: must be included in custom levels`. `next build` обнаруживался это во время page-data collection — например, на `/api/admin/disputes/[id]` — и валился. Теперь `LOG_LEVEL?.trim()` + явная проверка длины, пустые/whitespace значения возвращаются к дефолту (debug/info).
- [ ] Локальный smoke с dev сервером (`npm run dev`): требует поднятого Postgres → пропустили на CI-боксе; build уже подтверждает, что все API-роуты и страницы успешно проходят page-data collection.
- [ ] OAuth: если credentials пришли — проверить login flow через Google (пока credentials не предоставлены, кнопки скрыты, что подтверждено отсутствием ENV).
- [ ] Если deploy сделан — повторить smoke в prod-окружении.

### Block F — PR

- [ ] Push branch `devin/1779753126-admin-and-oauth`.
- [ ] Open PR через `git_create_pr` (не мержить).
- [ ] Сообщить пользователю.

---

## HANDOFF NOTES (читай ОБЯЗАТЕЛЬНО перед продолжением)

**Branch:** `devin/1779753126-admin-and-oauth` (стартовая точка: `main` @ `f65f009`).

**Последняя точка остановки:** Block A–D code committed. Block E частично сделан (lint/typecheck/test/build зелёные на чистом `.env`, дополнительно вылез и зафикшен баг с пустым LOG_LEVEL в `src/lib/logger.ts` → commit `f4d107a8`). Следующий — открыть PR (Block F).

Что осталось сделать:

1. Block F — открыть PR через `git_create_pr` (НЕ мержить).
2. Live smoke-тест в dev окружении (нужен Postgres + правильный `.env`): покрывает `/admin/payouts`, `/admin/products/new`, `/sign-in`. Build уже подтверждает, что модули грузятся; runtime DB-зависимый smoke оставлен владельцу.
3. Когда пользователь пришлёт Google credentials — добавить в `.env` и проверить Google sign-in.
4. Apple Sign-In: ждём решения пользователя (Apple Developer Program $99/yr) или скип.

OAuth credentials: пользователь должен прислать.

- Google: Client ID + Secret (5 мин).
- Apple: $99/год + 1-2 часа настройки; пользователь может скип, тогда кнопка просто не показывается.

**Что точно НЕ надо повторять:**

- НЕ переделывать `src/lib/logger.ts` — фикс сделан, причина задокументирована в комменте сверху файла.
- НЕ создавать отдельный admin-specific `<AdminProductForm>` компонент — `ProductForm` в `src/app/seller/products/product-form.tsx` уже параметризован пропсами и работает для обоих сценариев.
- НЕ менять `/api/seller/products` — admin flow использует отдельный `/api/admin/products`.
- НЕ хранить аплоадные файлы в репо — `public/uploads` в `.gitignore`.
- НЕ возвращать «Seeded logins» в `src/app/sign-in/page.tsx`.
- НЕ создавать новый компонент формы — `src/app/seller/products/product-form.tsx` уже generic, переиспользуй через пропсы.
- НЕ создавать новые endpoint'ы для seller flow — `/api/seller/products` остался как есть, поведение НЕ изменилось.

**Зависимости от пользователя (блокирует Block D):**

- Google OAuth: пользователь должен прислать `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` из Google Cloud Console.
- Apple Sign-In: пользователь должен решить — оформляет ли Apple Developer ($99/год) или скип/альтернатива (Yandex/VK).
- Email magic-link: пользователь должен уточнить — нужен ли вход по ссылке (passwordless) или email/password достаточно.

Можно писать код OAuth со stub'ами env-vars и UI кнопками за feature-flag, чтобы при поступлении credentials всё включалось без правок кода.

**Локальный запуск (dev):**

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
# открыть http://localhost:3000
# admin user: admin@neuromarket.dev / password123 (только локально!)
```

**Storage в dev:** `STORAGE_PROVIDER=local` (default) → файлы в `public/uploads/`, гитнорнут.
