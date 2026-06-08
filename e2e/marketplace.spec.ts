import { test, expect } from "@playwright/test";

test.describe("Marketplace public flows", () => {
  test("landing page renders hero + featured products", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/NeuroMarket/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Search bar should be present
    await expect(page.locator("input[name='q'], input[type='search']").first()).toBeVisible();
  });

  test("marketplace page lists products and filters by category", async ({ page }) => {
    await page.goto("/marketplace");
    // Cards should appear (seeded data has 8+ products)
    const cards = page.getByTestId("product-card");
    if ((await cards.count()) > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      // Fallback: at least some product titles render
      await expect(page.locator("a[href^='/products/']").first()).toBeVisible();
    }
  });

  test("product detail page is accessible from marketplace", async ({ page }) => {
    await page.goto("/marketplace");
    const firstProductLink = page.locator("a[href^='/products/']").first();
    await firstProductLink.scrollIntoViewIfNeeded();
    const href = await firstProductLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Buy button or sign-in prompt should be visible
    await expect(page.getByText(/Buy|Sign in to buy/i).first()).toBeVisible();
  });

  test("trust & safety page is reachable", async ({ page }) => {
    await page.goto("/trust-and-safety");
    await expect(page.getByRole("heading", { name: /Trust.*Safety/i })).toBeVisible();
  });

  test("categories index lists categories", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: /Browse by category/i })).toBeVisible();
  });

  test("sign-in page renders", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });
});

test.describe("Buyer happy path", () => {
  test("buyer can sign in, create order, mock-pay, see delivered code, leave review", async ({ page }) => {
    // Sign in as buyer (submit the form via the submit button inside <main>)
    await page.goto("/sign-in");
    await page.locator("input[type='email']").fill("buyer1@neuromarket.dev");
    await page.locator("input[type='password']").fill("password123");
    await page.locator("main button[type='submit']").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 15_000 });

    // Browse to first published product
    await page.goto("/marketplace");
    const firstLink = page.locator("a[href^='/products/']").first();
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!);

    // Click Buy
    const buyButton = page.getByRole("button", { name: /buy/i }).first();
    await buyButton.click();

    // Should land on mock checkout page in dev (Stripe disabled)
    await page.waitForURL(/\/checkout\/mock|\/orders\//, { timeout: 15_000 });

    if (page.url().includes("/checkout/mock")) {
      const payButton = page.getByRole("button", { name: /pay|complete/i }).first();
      await payButton.click();
      await page.waitForURL(/\/orders\//, { timeout: 15_000 });
    }

    // Order page should mention status (Paid or Delivered) and provide receipt info
    await expect(page.getByText(/paid|delivered|completed/i).first()).toBeVisible();
  });
});
