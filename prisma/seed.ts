/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  PrismaClient,
  ProductType,
  DeliveryType,
  ProductStatus,
  SellerVerificationStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeRiskScore } from "../src/lib/risk";
import { decryptString, encryptString } from "../src/lib/crypto";

const prisma = new PrismaClient();

// --- Markdown source ---------------------------------------------------------

const TITLES_PATH = path.resolve(__dirname, "..", "yandex_market_ai_product_titles.md");
const NOT_FOUND_MARKER = "Не найдено в публичной выдаче";

// Where category-level cover images live: /public/product-covers/<slug>/<file>
const COVERS_PUBLIC_ROOT = "/product-covers";
const COVERS_DISK_ROOT = path.resolve(__dirname, "..", "public", "product-covers");

/**
 * Returns the public URLs of all images for the given category slug, sorted
 * alphabetically (image_1.webp, image_2.webp, …). Empty array when the folder
 * doesn't exist or contains nothing.
 */
function imagesForCategory(slug: string): string[] {
  const dir = path.join(COVERS_DISK_ROOT, slug);
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(webp|png|jpg|jpeg|svg)$/i.test(f))
    .sort();
  return files.map((f) => `${COVERS_PUBLIC_ROOT}/${slug}/${f}`);
}

interface ParsedEntry {
  section: string;
  title: string;
}

function parseTitles(filePath: string): ParsedEntry[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);

  let section: string | null = null;
  const seen = new Set<string>();
  const out: ParsedEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith("## ")) {
      section = trimmed.slice(3).trim();
      continue;
    }
    if (!section) continue;
    if (!trimmed.startsWith("- ")) continue;

    const title = trimmed.slice(2).trim();
    if (!title) continue;
    if (title === NOT_FOUND_MARKER) continue;
    if (seen.has(title)) continue;
    seen.add(title);

    out.push({ section, title });
  }

  return out;
}

// --- Slug + dedupe -----------------------------------------------------------

const transliterationMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function slugify(input: string): string {
  const lowered = input.toLowerCase();
  let out = "";
  for (const ch of lowered) {
    if (ch in transliterationMap) {
      out += transliterationMap[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else {
      out += "-";
    }
  }
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (out.length === 0) out = "item";
  if (out.length > 90) out = out.slice(0, 90).replace(/-+$/g, "");
  return out;
}

function uniqueSlug(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (used.has(`${base}-${i}`)) i++;
  const finalSlug = `${base}-${i}`;
  used.add(finalSlug);
  return finalSlug;
}

// --- Per-product heuristics (kept conservative — derived only from title) ----

/**
 * Pick a product type based on what the title literally says:
 *   - "пополнение / credits / кредитов / пакет / долларов" → LICENSE_KEY
 *   - "курс / инструкция / гайд" → DIGITAL_FILE
 *   - everything else → VOUCHER_CODE (default for "подписка / тариф / доступ")
 */
function detectProductType(title: string): ProductType {
  const t = title.toLowerCase();
  if (/\b(пополнен|кредит|credits|пакет\s+кредитов|долларов|\$\s*\d|usd)\b/.test(t)) {
    return ProductType.LICENSE_KEY;
  }
  if (/\b(курс|инструкц|гайд|обучающ)\b/.test(t)) {
    return ProductType.DIGITAL_FILE;
  }
  return ProductType.VOUCHER_CODE;
}

function detectDeliveryType(productType: ProductType): DeliveryType {
  if (productType === ProductType.DIGITAL_FILE) return DeliveryType.INSTANT;
  return DeliveryType.INSTANT;
}

/**
 * Very rough price heuristic, derived ONLY from cues already present in the
 * title (duration, dollar amount). Default $14.99. The marketplace owner is
 * expected to adjust prices manually after seeding.
 */
function detectPriceCents(title: string): number {
  const usdMatch = title.match(/(\d{1,4})\s*(долларов|usd|\$)/i);
  if (usdMatch) {
    const usd = parseInt(usdMatch[1], 10);
    if (usd > 0 && usd < 1000) return usd * 100;
  }

  if (/(бессроч|lifetime|неограничен)/i.test(title)) return 7999;
  if (/(18\s*мес|24\s*мес|2\s*год)/i.test(title)) return 8999;
  if (/(12\s*мес|1\s*год|годов)/i.test(title)) return 5999;
  if (/(6\s*мес)/i.test(title)) return 3999;
  if (/(3\s*мес)/i.test(title)) return 2499;
  if (/(1\s*мес|30\s*дн|месяц)/i.test(title)) return 1499;
  return 1499;
}

/** Rough stock so cards render as "in stock" by default. */
function detectStock(): number {
  return 10;
}

function buildShortDescription(section: string, title: string): string {
  const collapsed = title.replace(/\s+/g, " ").trim();
  if (collapsed.length <= 200) return collapsed;
  return collapsed.slice(0, 197) + "…";
}

function buildDescription(section: string, title: string): string {
  return [title, "", `Раздел каталога NeuroMarket: ${section}.`].join("\n");
}

// --- Main seeding ------------------------------------------------------------

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed disabled in production");
  }

  const seedPassword = process.env.SEED_PASSWORD ?? `dev-${randomBytes(8).toString("base64url")}`;

  console.log("🌱 Seeding NeuroMarket from yandex_market_ai_product_titles.md…");

  const entries = parseTitles(TITLES_PATH);
  if (entries.length === 0) {
    throw new Error(`No product titles parsed from ${TITLES_PATH}`);
  }
  console.log(`  parsed ${entries.length} unique titles across the .md sections`);

  // Wipe everything before reseeding (FK order matters)
  await prisma.auditLog.deleteMany();
  await prisma.productReport.deleteMany();
  await prisma.disputeMessage.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.commissionRecord.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.digitalInventoryItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.sellerVerificationRequest.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // Build categories — one per markdown section that yielded ≥1 product
  const sectionOrder: string[] = [];
  for (const e of entries) {
    if (!sectionOrder.includes(e.section)) sectionOrder.push(e.section);
  }
  const categoryIdBySection: Record<string, string> = {};
  const categorySlugBySection: Record<string, string> = {};
  for (let i = 0; i < sectionOrder.length; i++) {
    const name = sectionOrder[i];
    const slug = slugify(name);
    const created = await prisma.category.create({
      data: {
        name,
        slug,
        description: `Подписки и доступы из раздела «${name}» в каталоге NeuroMarket.`,
        sortOrder: i,
        iconKey: "sparkles",
      },
    });
    categoryIdBySection[name] = created.id;
    categorySlugBySection[name] = slug;
  }
  console.log(`  created ${sectionOrder.length} categories`);

  // Users
  const pw = await bcrypt.hash(seedPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@neuromarket.dev",
      name: "Nora Admin",
      passwordHash: pw,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  void admin;

  const seller1User = await prisma.user.create({
    data: {
      email: "seller1@neuromarket.dev",
      name: "Quill Labs",
      passwordHash: pw,
      role: UserRole.SELLER,
      emailVerified: new Date(),
    },
  });
  const seller2User = await prisma.user.create({
    data: {
      email: "seller2@neuromarket.dev",
      name: "Pixel Forge",
      passwordHash: pw,
      role: UserRole.SELLER,
      emailVerified: new Date(),
    },
  });
  const seller3User = await prisma.user.create({
    data: {
      email: "seller3@neuromarket.dev",
      name: "Synthwave Studios",
      passwordHash: pw,
      role: UserRole.SELLER,
      emailVerified: new Date(),
    },
  });

  const seller1 = await prisma.sellerProfile.create({
    data: {
      userId: seller1User.id,
      displayName: "Quill Labs",
      bio: "Verified seller of AI subscriptions and digital access.",
      country: "United States",
      contactEmail: "hello@quill.labs",
      verificationStatus: SellerVerificationStatus.APPROVED,
      verifiedAt: new Date(),
      rating: 4.8,
      ratingCount: 1241,
      availableBalance: 84_000,
      pendingBalance: 12_500,
    },
  });
  const seller2 = await prisma.sellerProfile.create({
    data: {
      userId: seller2User.id,
      displayName: "Pixel Forge",
      bio: "Verified partner for image, video and creative AI tools.",
      country: "United Kingdom",
      contactEmail: "team@pixelforge.dev",
      verificationStatus: SellerVerificationStatus.APPROVED,
      verifiedAt: new Date(),
      rating: 4.7,
      ratingCount: 892,
      availableBalance: 56_200,
      pendingBalance: 8_400,
    },
  });
  const seller3 = await prisma.sellerProfile.create({
    data: {
      userId: seller3User.id,
      displayName: "Synthwave Studios",
      bio: "Independent AI dev-tools reseller (verification pending).",
      country: "Germany",
      contactEmail: "studio@synthwave.dev",
      verificationStatus: SellerVerificationStatus.PENDING,
      rating: 4.9,
      ratingCount: 233,
      availableBalance: 0,
      pendingBalance: 22_000,
    },
  });
  await prisma.sellerVerificationRequest.create({
    data: {
      sellerId: seller3.id,
      fullName: "Lina Friedrich",
      country: "Germany",
      contactEmail: "studio@synthwave.dev",
      websiteUrl: "https://synthwave.dev",
      productsDescription: "AI dev-tool resale and prompt engineering courses.",
      authorizationNotes: "I run my own consultancy and authored all listed materials.",
      acceptedRules: true,
      status: SellerVerificationStatus.PENDING,
    },
  });

  const buyerNames = [
    ["buyer1@neuromarket.dev", "Avery Park"],
    ["buyer2@neuromarket.dev", "Jules Iwu"],
    ["buyer3@neuromarket.dev", "Sam Patel"],
    ["buyer4@neuromarket.dev", "Mei Tanaka"],
    ["buyer5@neuromarket.dev", "Diego Alvarez"],
  ] as const;
  const buyers = [];
  for (const [email, name] of buyerNames) {
    const u = await prisma.user.create({
      data: { email, name, passwordHash: pw, role: UserRole.BUYER, emailVerified: new Date() },
    });
    buyers.push(u);
  }

  // Distribute products across the three sellers in a stable round-robin so
  // every seller has stock (purely for demo purposes — has no effect on what
  // titles get created).
  const sellerPool = [seller1.id, seller1.id, seller1.id, seller2.id, seller2.id, seller3.id];

  // Pre-compute the list of available images for every category, so the loop
  // below stays a hot path without re-reading the disk for every product.
  const imagesBySection: Record<string, string[]> = {};
  for (const section of sectionOrder) {
    imagesBySection[section] = imagesForCategory(categorySlugBySection[section]);
  }
  const sectionsWithImages = sectionOrder.filter((s) => imagesBySection[s].length > 0);
  const sectionsWithoutImages = sectionOrder.filter((s) => imagesBySection[s].length === 0);
  console.log(`  ${sectionsWithImages.length}/${sectionOrder.length} categories have images`);

  const usedSlugs = new Set<string>();
  const perSection: Record<string, number> = {};
  const createdProducts: {
    id: string;
    sellerId: string;
    productType: ProductType;
    deliveryType: DeliveryType;
    priceCents: number;
    title: string;
  }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const { section, title } = entries[i];
    const productType = detectProductType(title);
    const deliveryType = detectDeliveryType(productType);
    const priceCents = detectPriceCents(title);
    const stockQuantity = detectStock();
    const baseSlug = slugify(title);
    const slug = uniqueSlug(baseSlug, usedSlugs);
    const sellerId = sellerPool[i % sellerPool.length];
    const sellerVerified = sellerId !== seller3.id;

    const risk = computeRiskScore({
      title,
      description: title,
      priceCents,
      productType,
      deliveryType,
      isSellerVerified: sellerVerified,
    });

    // 3 dummy inventory codes so the buy flow has something to pop. Codes are
    // encrypted at rest like everywhere else in the codebase.
    const codes = [
      `NM-${slug.slice(0, 18).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}-1`,
      `NM-${slug.slice(0, 18).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}-2`,
      `NM-${slug.slice(0, 18).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}-3`,
    ];

    // Rotate the cover order per product within its section so the *primary*
    // cover (position 0) cycles through image_1…image_N instead of every card
    // in a category showing the same first image. Product 0 keeps the natural
    // order, product 1 starts at image_2, etc.
    const sectionIndex = perSection[section] ?? 0;
    const baseImages = imagesBySection[section];
    const sectionImages = baseImages.length
      ? baseImages.map((_, k) => baseImages[(k + sectionIndex) % baseImages.length])
      : baseImages;
    const created = await prisma.product.create({
      data: {
        sellerId,
        categoryId: categoryIdBySection[section],
        title,
        slug,
        shortDescription: buildShortDescription(section, title),
        description: buildDescription(section, title),
        productType,
        deliveryType,
        priceCents,
        currency: "USD",
        stockQuantity,
        manualDeliveryWindowHours: 48,
        isVerified: sellerVerified,
        isModerated: true,
        status: ProductStatus.PUBLISHED,
        riskScore: risk,
        salesCount: 0,
        rating: 0,
        ratingCount: 0,
        // Attach all available cover images for this section. Sections
        // without any artwork get no images and the card falls back to the
        // category-name placeholder.
        images: sectionImages.length
          ? {
              create: sectionImages.map((url, position) => ({
                url,
                alt: title,
                position,
              })),
            }
          : undefined,
        inventoryItems: {
          create: codes.map((c) => ({ code: encryptString(c) })),
        },
      },
    });

    perSection[section] = (perSection[section] ?? 0) + 1;
    createdProducts.push({
      id: created.id,
      sellerId,
      productType,
      deliveryType,
      priceCents,
      title,
    });
  }

  console.log(`  created ${createdProducts.length} products`);
  for (const s of sectionOrder) {
    const has = imagesBySection[s].length > 0 ? "🖼️ " : "  ";
    console.log(`    ${has}${s.padEnd(20)} ${perSection[s] ?? 0}`);
  }
  if (sectionsWithoutImages.length > 0) {
    console.log("");
    console.log("Sections without cover images:");
    for (const s of sectionsWithoutImages) console.log(`  - ${s}`);
  }

  // One demo completed order with a review, so the buyer dashboard / seller
  // analytics views aren't empty after a fresh seed.
  const demo = createdProducts[0];
  if (demo) {
    const inv = await prisma.digitalInventoryItem.findFirst({
      where: { productId: demo.id, status: "AVAILABLE" },
    });
    if (inv) {
      const subtotal = demo.priceCents;
      const platformFee = Math.round(subtotal * 0.1);
      const processingFee = Math.round(subtotal * 0.029) + 30;
      const sellerEarnings = subtotal - platformFee - processingFee;

      const order = await prisma.order.create({
        data: {
          buyerId: buyers[0].id,
          status: "COMPLETED",
          subtotalCents: subtotal,
          platformFeeCents: platformFee,
          processingFeeCents: processingFee,
          totalCents: subtotal,
          currency: "USD",
          paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          items: {
            create: [
              {
                productId: demo.id,
                sellerId: demo.sellerId,
                title: demo.title,
                priceCents: demo.priceCents,
                deliveryType: demo.deliveryType,
                productType: demo.productType,
                deliveredCode: decryptString(inv.code),
                deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              },
            ],
          },
          payment: {
            create: {
              amountCents: subtotal,
              status: "SUCCEEDED",
              providerId: "yookassa",
              providerPaymentId: "seed_yookassa_demo_001",
              idempotencyKey: "seed-idem-001",
              currency: "RUB",
              paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            },
          },
          commissionRecord: {
            create: {
              sellerId: demo.sellerId,
              feePercent: 10,
              feeCents: platformFee,
              processingFeeCents: processingFee,
              sellerEarningsCents: sellerEarnings,
            },
          },
        },
        include: { items: true },
      });
      await prisma.digitalInventoryItem.update({
        where: { id: inv.id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          orderItemId: order.items[0].id,
        },
      });
      await prisma.review.create({
        data: {
          orderId: order.id,
          productId: demo.id,
          sellerId: demo.sellerId,
          buyerId: buyers[0].id,
          rating: 5,
          text: "Доставка прошла моментально, всё работает.",
        },
      });
    }
  }

  console.log("✓ Seed complete");
  console.log(`Seed password (all users): ${seedPassword}`);
  console.log("Admin login:  admin@neuromarket.dev");
  console.log(
    "Seller logins: seller1@neuromarket.dev / seller2@neuromarket.dev / seller3@neuromarket.dev",
  );
  console.log("Buyer logins:  buyer1..buyer5@neuromarket.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
