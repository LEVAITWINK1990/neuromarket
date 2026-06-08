# Handoff — Gamivo-style redesign of NeuroMarket

> **Кому:** следующая нейросеть/разработчик, который продолжит этот проект.
> **Когда:** 2026-05-29.
> **Где:** `C:\Users\HUAWEI\Desktop\kiro\neyro-github` (репозиторий
> `hkdkshxj5666alex/neuromarket`, ветка `main`).
>
> Прочитай этот документ целиком до того, как трогать файлы. В разделе
> «Не переделывать» перечислено то, что уже было обсуждено и закрыто —
> повторно туда не лезь.

---

## 1. Что это за проект

NeuroMarket — Next.js 14 (App Router) маркетплейс цифровых товаров: AI-подписки,
лицензии, ваучеры, API-кредиты, услуги. До нашей сессии это был полноценный,
production-hardened шаблон с Prisma, PostgreSQL, NextAuth, YooKassa, i18n
(ru/en), e2e-тестами и т. д. Подробности по предыдущим фазам — в
`docs/CURRENT-WORK.md` (Block A–F: фикс логгера, удаление seeded-creds,
admin product publishing, OAuth Google/Apple, i18n).

Стек по факту:

- Next.js 14.2.18 (App Router) + TypeScript
- Tailwind 3.4 + shadcn/ui + Radix UI
- Prisma 5 + PostgreSQL (схема в `prisma/schema.prisma`)
- NextAuth v5 beta (credentials + Google + Apple)
- next-intl для ru/en (`messages/{ru,en}.json`)
- Vitest unit, Playwright e2e
- YooKassa как PaymentProvider

## 2. Что нам сказал владелец

Главная задача этой сессии — **переделать сайт визуально и по структуре в
стиле <https://www.gamivo.com>**, при этом сохранив доменную модель: мы
продаём **AI-инструменты**, а не игры. Дословно владелец писал:

> «Делаем не копию, мы не воруем проект. Мы делаем свой, у нас он будет
> отличаться. Но максимально, чтобы на 99% был вот как вот этот.»

Так что цель — повторить **визуальный язык Gamivo** (тёмный фон, яркий
оранжевый акцент, плотная навигация, большой hero-баннер с превью под ним,
плотные карточки товаров с бейджами скидок, SMART-программа), но оставить
тематику AI-сервисов и собственный бренд `neuromarket`.

## 3. Что уже сделано в этой сессии

### 3.1 Дизайн-система

- `src/app/globals.css` — переписана палитра. Дефолт — тёмная тема с
  оранжевым primary `hsl(22 95% 54%)`, красный для скидок, тёплый
  тёмный фон. Зелёный акцент (старый) убран.
- `--radius` = `0.625rem`, для крупных контейнеров используется
  `rounded-xl/2xl/full`. Острые квадратные углы намеренно скруглены
  (это была отдельная итерация по запросу владельца).
- `tailwind.config.ts` — расширена палитра (header, discount, smart),
  подключён шрифт Inter, добавлены keyframes.
- `src/app/layout.tsx` — Inter подключён через `next/font/google`,
  тема по умолчанию `dark`, `enableSystem={false}`.

### 3.2 Хедер / футер / общие компоненты

- `src/components/site-header.tsx` — плотная Gamivo-подобная шапка:
  большой белый поиск с оранжевой кнопкой `НАЙТИ`, корзина, переключатель
  языка, USD-индикатор. Снизу — навигация с короткими uppercase-пунктами
  (`AI-подписки`, `API-кредиты`, `Изображения`, `Dev Tools`, `Услуги`,
  `Новинки`) + оранжевая кнопка `КАТАЛОГ` (выпадашка) и SMART-чип `-20%`.
- `src/components/site-footer.tsx` — newsletter-strip, 4 колонки,
  payment chips, Trustpilot-плашка, соцсети. Скруглённый.
- `src/components/brand.tsx` — wordmark «N + neuro/market», оранжевый
  тайл `N`. Размеры sm/md/lg, поддержка `invert`.
- `src/components/locale-switcher.tsx` — pill, активный язык в
  оранжевом овале.
- `src/components/ui/{button,badge}.tsx` — кнопки `rounded-lg/full`,
  badge получил варианты `discount`, `smart`, `info`. Кнопки крупные,
  оранжевые, uppercase для CTA.
- `src/components/section-header.tsx` — заголовок секции с разделительной
  линией + `View all` → `Все товары` справа.

### 3.3 Главная

- `src/app/page.tsx` — собирает данные из БД и рендерит:
  1. `HeroBanner` (карусель) — слайды собираются из топ-8 продуктов из
     `bestsellers`. На каждом слайде — обложка из БД (если есть),
     бейдж категории, заголовок-название товара, краткое описание, цена
     `from $XX.XX`, оранжевая CTA-кнопка `Купить`.
  2. `PlatformStrip` — список платформ-категорий иконками.
  3. `SmartCard` — оранжевый промо-блок про SMART-подписку.
  4. Today's SMART deals — карточки с искусственной скидкой 25%.
  5. Bestsellers (TOP-10 с цифрами в оранжевых кругах).
  6. Trust strip (4 пункта: instant delivery / buyer protection /
     verified sellers / 24/7 support).
  7. Latest deals / Новинки / Collection banners / Discover blocks /
     финальный CTA.
- `src/components/hero-banner.tsx` — клиентский компонент. Если у
  слайда нет `cover`, рендерит цветной градиентный плейсхолдер
  `<SlidePlaceholder>`. Высота 300/420/460px на mobile/md/lg.
- `src/components/product-card.tsx` — Gamivo-style карточка.
  Изображение `aspect-[3/4]`, бейджи скидки/SMART сверху-слева, регион
  и платформа — сверху-справа, delivery+verified — снизу-слева,
  снизу-справа — оранжевая CTA `Купить`. Если у товара нет картинки,
  показывает заглушку с названием категории.
- `src/components/{platform-strip,smart-card,discover-tile,promo-carousel}.tsx`
  — вспомогательные блоки (см. файлы).
- `src/components/ai-cover.tsx` — устаревший компонент с CSS-арт-обложками
  (был экспериментом). Сейчас в hero не используется, но файл оставлен.

### 3.4 Каталог / сидер

Это самая важная часть текущего состояния. Владелец положил в корне репо:

- `yandex_market_ai_product_titles.md` — список реальных названий товаров
  с Я.Маркета, сгруппированных по нейросети (`## ChatGPT`, `## Claude`,
  ...). Всего 47 секций, около 300 строк-названий. Среди строк есть
  две, помеченные `Не найдено в публичной выдаче` — их нужно пропускать
  (`GitHub Copilot`, `Seedream`).
- `neuralnet_images/` — папка-источник изображений. 12 подпапок
  (`ChatGPT`, `Claude`, `Midjourney`, `Cursor`, `Gemini`, `Grok`,
  `Perplexity`, `Canva`, `CapCut`, `Microsoft Copilot`, `Syntx AI`,
  `AIAcademy`), в каждой — 5 файлов `image_1.webp ... image_5.webp`.
  Это пользовательские картинки, **их трогать нельзя** (`gitignore` их
  не трогает, они просто лежат в корне).

`prisma/seed.ts` полностью переписан: парсит markdown-файл, создаёт
**одну категорию = одна секция `##`** и **один товар = одна строка
`- ...`** (точное название из файла, без перефраза). Описание
формируется автоматически: первая строка — само название, ниже
`Раздел каталога NeuroMarket: <секция>`. Никакие гарантии/сроки не
выдумываются — это явное требование владельца.

Эвристики, которые применяет seed:

- `productType`: `LICENSE_KEY` для `пополнение/credits/долларов`,
  `DIGITAL_FILE` для `курс/гайд/инструкция`, иначе `VOUCHER_CODE`.
- `priceCents`: примерные цены от $14.99 (1 мес) до $79.99 (lifetime),
  по ключевым словам в названии. Это заглушка — владелец сам поправит.
- На каждый товар создаётся 3 шифрованных кода в `digitalInventoryItem`,
  чтобы checkout-flow работал.
- Распределение по продавцам — round-robin: `seller1` × 3, `seller2` × 2,
  `seller3` × 1 (последний — pending verification).
- `imagesForCategory(slug)` ищет файлы в
  `public/product-covers/<slug>/` (где slug — слаг категории, например
  `chatgpt`, `claude`, `aiacademy`, `copilot-pro`, `syntx-ai`,
  `gemini` и т. д.). Если папки нет — товар идёт без изображений и
  карточка падает в плейсхолдер.

После seed:

- 47 категорий (45 с товарами + 2 пустых не создаются, потому что
  «не найдено» отфильтровывается)
- **276 товаров**
- **12 категорий** с реальными изображениями (из
  `neuralnet_images/`)
- **35 категорий** без изображений

Маппинг исходник → слаг категории (учти при подкладке новых картинок):

| `neuralnet_images/...` | `public/product-covers/<slug>/`                    |
| ---------------------- | -------------------------------------------------- |
| `AIAcademy/`           | `aiacademy/`                                       |
| `Canva/`               | `canva/`                                           |
| `CapCut/`              | `capcut/`                                          |
| `ChatGPT/`             | `chatgpt/`                                         |
| `Claude/`              | `claude/`                                          |
| `Cursor/`              | `cursor/`                                          |
| `Gemini/`              | `gemini/`                                          |
| `Grok/`                | `grok/`                                            |
| `Microsoft Copilot/`   | `copilot-pro/` _(имя секции в md = «Copilot Pro»)_ |
| `Midjourney/`          | `midjourney/`                                      |
| `Perplexity/`          | `perplexity/`                                      |
| `Syntx AI/`            | `syntx-ai/`                                        |

### 3.5 Удалено / удаляли

Чтобы не накапливать мусор:

- старые seed-файлы placeholder-картинок и SVG-генераторы
  (`scripts/generate-product-covers.mjs`,
  `scripts/generate-placeholder-covers.mjs`) — удалены
- старая папка `public/product-covers/` (с авто-сгенерированными
  обложками) — удалена и восстановлена из `neuralnet_images/`
- хардкод `cover: "/product-covers/..."` в `src/app/page.tsx` —
  заменён на чтение `images[0]?.url ?? null` из БД, чтобы не висеть на
  битых ссылках, если картинок нет

### 3.6 i18n

Ключи `header.cat_*_short`, `header.smart_cta`, `footer.*`,
`product_card.*` обновлены в `messages/en.json` и `messages/ru.json`.
**Главная страница (`src/app/page.tsx`) сейчас использует русские
литералы напрямую**, не через `getTranslations`. Это сделано
намеренно для скорости итерации. Если будешь оставлять — лучше
вынести в `messages/*.json` под ключ `home.*`. В `header.tsx`,
`footer.tsx`, `product-card.tsx` — i18n полноценный.

## 4. Где мы остановились — последний скриншот владельца

Владелец прислал скрин, где на hero крутится слайд `AIAcademy: все
нейросети — тариф "На каждый день"`, а в ряду превью — несколько
одинаковых коллажей AIAcademy. Причина: в `bestsellers` сейчас сортировка
по `salesCount desc, rating desc, createdAt asc`, а у всех товаров
salesCount=0 и rating=0, поэтому в TOP-8 попадают первые 8 товаров по
порядку создания, а это товары AIAcademy (первая секция в md по
алфавиту/порядку), у которых на всех 6 товарах одинаковая обложка-коллаж
(в самих исходниках `neuralnet_images/AIAcademy/image_*.webp` лежат
изображения, на которых нарисованы логотипы вообще ВСЕХ нейросетей —
это рекламные коллажи курса, а не отдельные продукты).

Я предложил владельцу:

1. Поправить hero, чтобы он собирался по топ-1 товару из каждой
   категории, у которой есть изображения, тогда в карусели будет 8
   разных продуктов с разными обложками (ChatGPT, Claude, Midjourney,
   Perplexity, Cursor, Grok, Gemini, Copilot Pro).
2. Оставить ли коллажные обложки AIAcademy в карточках или убрать —
   решение за владельцем.

**Владелец ответил `?` (то есть «что происходит»), а потом попросил
этот хэндофф-документ.** На момент написания документа — задача №1 ещё
**НЕ выполнена**. Это первое, что нужно сделать следующему агенту.

## 5. Что делать следующему

### 5.1 Срочно (сделать первым)

1. В `src/app/page.tsx` собрать `heroSlides` так, чтобы там было
   8 разных категорий, у которых есть изображения. Алгоритм:
   - выбрать 12 категорий с изображениями (см. список выше),
   - для каждой выбрать топ-1 товар (`orderBy: salesCount desc`),
   - в hero взять первые 8 уникальных по категории.
     В прозе плана:

   ```ts
   const categoriesWithImages = ["chatgpt","claude","midjourney","cursor","gemini","grok","perplexity","copilot-pro","canva","capcut","syntx-ai","aiacademy"];
   const heroProducts = await Promise.all(
     categoriesWithImages.map(slug =>
       prisma.product.findFirst({
         where: { status: "PUBLISHED", category: { slug } },
         orderBy: [{ salesCount: "desc" }, { rating: "desc" }, { createdAt: "asc" }],
         include: { category: true, seller: true, images: { orderBy: { position: "asc" }, take: 1 } },
       })
     ),
   );
   const heroSlides = heroProducts.filter(Boolean).slice(0, 8).map(...);
   ```

   Этот snippet — план, не финальный код; адаптируй под существующую
   структуру `getLandingData`.

2. Спросить у владельца, оставлять ли AIAcademy с коллажами в hero/в
   карточках. По умолчанию — оставить, но убрать AIAcademy из первых
   8 слайдов hero (он всё равно идёт на одной из последних позиций),
   чтобы первое впечатление от витрины было «коробочное», как у
   Gamivo.

### 5.2 Картинки, которых не хватает

35 категорий **без** обложек. Владелец будет докидывать вручную в
`public/product-covers/<slug>/` (имена слагов — в нижнем регистре,
без пробелов и спецсимволов). Полный список:

```
character-ai, dall-e, deepseek, elevenlabs, extinfo, flux,
freepik-ai, framer-ai, gamma-ai, genspark-ai, hailuo-ai, heygen,
higgsfield, iask-ai, ideogram, kimi-ai, kling-ai, krea-ai,
leonardo-ai, lovable, luma-ai, manus-ai, meshy-ai, nano-banana,
notebooklm, picsart-ai, recraft-ai, runway, seedance, sora, suno,
topaz-ai, udio-ai, veo, wealvy-ai
```

Когда владелец положит файлы — достаточно `npm run db:seed` и обложки
прицепятся ко всем товарам соответствующих категорий.

### 5.3 На потом (если не запросит явно — не делать)

- Marketplace-страница (`/marketplace`) и страница карточки
  (`/products/[slug]`) ещё в старом стиле. Их тоже надо привести к
  Gamivo-look (плотная сетка, фильтры слева, варианты регионов на
  карточке, related-блок).
- Cart + checkout flow визуально не доработан.
- На главной русские тексты захардкожены — вынести в `home.*` в
  `messages/{ru,en}.json` если понадобится английская версия.
- В `src/components/ai-cover.tsx` — мёртвый код, можно удалить.
- Hero-карусель сейчас использует `<img>`, не `next/image`. Если
  включишь оптимизацию, нужно добавить `remotePatterns` в
  `next.config.mjs` или просто оставить `<img>` для локальных webp.

## 6. Не переделывать (важно)

- **Не трогай `prisma/schema.prisma`** — там 7 миграций уже мерджнуты
  в main, добавление полей сломает прод.
- **Не переписывай `next-intl` конфиг** — он в порядке, ru — дефолтная
  локаль.
- **Не возвращай `pino-pretty` транспорт** в `src/lib/logger.ts` — он
  ломает Next.js worker thread (фикс был в commit `ebe18435`/`f4d107a8`).
- **Не возвращай "Seeded logins / password123"** в `/sign-in`.
- **Не пытайся скрейпить картинки** с playerok.com / Я.Маркета. Это
  обсуждалось, владелец согласился делать вручную.
- **Не пытайся выдумывать описания товаров**, которых нет в md-файле.
  Это явный пункт инструкции владельца.
- **Не переименовывай папки `public/product-covers/<slug>/`** — они
  совпадают со слагами категорий, иначе seed не подхватит изображения.
- **Не удаляй `neuralnet_images/`** — это пользовательский источник.
- **Не делай AICover-обложки** (CSS-арт). Эта попытка была отвергнута
  владельцем, картинки делаются только из реальных файлов.

## 7. Локальный запуск

```bash
# 1. установка (если в свежем чекауте)
npm install

# 2. база — Postgres крутится локально на :5432
#    .env уже сгенерирован, кредиты:
#    DATABASE_URL=postgresql://neuromarket:neuromarket@localhost:5432/neuromarket

# 3. миграции (если БД пустая)
npm run db:migrate

# 4. сидим каталог из markdown-файла
npm run db:seed

# 5. dev
npm run dev   # http://localhost:3000
```

Логины:

- admin: `admin@neuromarket.dev` / `password123`
- seller1..3: `sellerN@neuromarket.dev` / `password123`
- buyer1..5: `buyerN@neuromarket.dev` / `password123`

## 8. Полезные команды для следующего агента

```bash
# проверки перед коммитом
npm run lint
npm run typecheck

# пересеять каталог после правки .md или подкладки картинок
npm run db:seed

# посмотреть, у каких категорий есть/нет картинок —
# вывод сидера сам покажет в конце таблицу 🖼️
```

## 9. Контекст файлов, которых ещё нет в git (uncommitted на момент хэндоффа)

```
M package.json
M prisma/seed.ts                  ← парсер md + auto-cover
M src/app/globals.css             ← новая палитра
M src/app/layout.tsx              ← Inter + dark default
M src/app/page.tsx                ← Gamivo-главная
M src/components/locale-switcher.tsx
M src/components/product-card.tsx ← Gamivo-карточка
M src/components/site-footer.tsx  ← новый футер
M src/components/site-header.tsx  ← новая шапка
M src/components/ui/badge.tsx     ← discount/smart/info варианты
M src/components/ui/button.tsx    ← rounded-lg/full
M tailwind.config.ts

?? .vscode/
?? neuralnet_images/              ← пользовательский источник картинок
?? public/product-covers/         ← подключённые обложки (12/47)
?? src/components/ai-cover.tsx    ← мёртвый эксперимент, можно удалить
?? src/components/brand.tsx
?? src/components/discover-tile.tsx
?? src/components/hero-banner.tsx
?? src/components/platform-strip.tsx
?? src/components/promo-carousel.tsx
?? src/components/section-header.tsx
?? src/components/smart-card.tsx
?? yandex_market_ai_product_titles.md   ← каноничный список товаров
```

Это всё нужно будет коммитить отдельным PR в финале — либо одной
пачкой `feat(ui): gamivo-style redesign + catalog from yandex md`,
либо разбитьна 2: «redesign» и «catalog».

## 10. Тон общения с владельцем

Владелец предпочитает:

- русский язык
- короткие ответы по делу, без воды и без излишнего самопиара
- честные предупреждения, если что-то «получится плохо» (он сам
  такое озвучивает заранее)
- не отвлекать на советы по бизнес-логике, если он не просил
- картинки/арт он подкидывает сам, не предлагай скрейпить чужие
  магазины

Удачи.
