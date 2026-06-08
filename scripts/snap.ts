import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("/tmp/neuromarket-shots");
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE ?? "http://127.0.0.1:3000";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const shots: { url: string; name: string; wait?: string }[] = [
    { url: "/", name: "landing.png" },
    { url: "/marketplace", name: "marketplace.png" },
    { url: "/categories", name: "categories.png" },
    { url: "/trust-and-safety", name: "trust-and-safety.png" },
    { url: "/sellers", name: "sellers-info.png" },
  ];
  for (const s of shots) {
    await page.goto(BASE + s.url, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, s.name), fullPage: true });
    console.log("captured", s.url);
  }

  // Sign in as admin and screenshot admin pages
  await page.goto(BASE + "/sign-in", { waitUntil: "networkidle" });
  await page.locator("input[type='email']").fill("admin@neuromarket.dev");
  await page.locator("input[type='password']").fill("password123");
  await page.locator("main button[type='submit']").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 15000 });
  for (const adminPath of [
    "/admin",
    "/admin/products",
    "/admin/disputes",
    "/admin/verifications",
    "/admin/audit",
  ]) {
    await page.goto(BASE + adminPath, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(OUT, "admin-" + adminPath.split("/").filter(Boolean).slice(-1)[0] + ".png"),
      fullPage: true,
    });
    console.log("captured", adminPath);
  }

  // Sign out, sign in as seller, screenshot
  await page.goto(BASE + "/api/auth/signout");
  await page.waitForLoadState("networkidle");
  await page.goto(BASE + "/sign-in");
  await page.locator("input[type='email']").fill("seller1@neuromarket.dev");
  await page.locator("input[type='password']").fill("password123");
  await page.locator("main button[type='submit']").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 15000 });
  for (const sellerPath of ["/seller", "/seller/products", "/seller/orders", "/seller/payouts"]) {
    await page.goto(BASE + sellerPath, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(OUT, "seller-" + sellerPath.split("/").filter(Boolean).slice(-1)[0] + ".png"),
      fullPage: true,
    });
    console.log("captured", sellerPath);
  }

  // Sign out, sign in as buyer, screenshot dashboard
  await page.goto(BASE + "/api/auth/signout");
  await page.goto(BASE + "/sign-in");
  await page.locator("input[type='email']").fill("buyer1@neuromarket.dev");
  await page.locator("input[type='password']").fill("password123");
  await page.locator("main button[type='submit']").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 15000 });
  for (const buyerPath of ["/dashboard", "/dashboard/orders"]) {
    await page.goto(BASE + buyerPath, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(OUT, "buyer-" + buyerPath.split("/").filter(Boolean).slice(-1)[0] + ".png"),
      fullPage: true,
    });
    console.log("captured", buyerPath);
  }

  // Product detail page
  await page.goto(BASE + "/marketplace", { waitUntil: "networkidle" });
  const firstHref = await page.locator("a[href^='/products/']").first().getAttribute("href");
  if (firstHref) {
    await page.goto(BASE + firstHref, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, "product-detail.png"), fullPage: true });
    console.log("captured", firstHref);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
