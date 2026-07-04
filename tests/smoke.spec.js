const { test, expect } = require("@playwright/test");

const PAGES = [
  { path: "/index.html", heading: /first impression/i },
  { path: "/portfolio.html", heading: /thumbnail wall/i },
  { path: "/story.html", heading: /photoshop/i },
  { path: "/contact.html", heading: /get in touch/i },
];

test.describe("page smoke tests", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} loads without error banner`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator(".site-error-banner")).toBeHidden();
      await expect(page.locator("header .logo")).toContainText("Kaalkine");
      const heroHeading = page.locator("main h1, .story-hero h1, .portfolio-hero h1, .contact-hero h1").first();
      await expect(heroHeading).toContainText(heading);
    });
  }

  test("navigation links reach portfolio and contact", async ({ page }) => {
    await page.goto("/index.html");
    await page.locator('nav a[href="portfolio.html"]').click();
    await expect(page).toHaveURL(/portfolio(\.html)?$/);
    await page.locator('nav a[href="contact.html"]').click();
    await expect(page).toHaveURL(/contact(\.html)?$/);
  });

  test("homepage hero lottie player is present", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.locator(".hero-lottie")).toBeVisible();
    await expect(page.locator(".hero-lottie svg")).toBeVisible({ timeout: 10000 });
  });

  test("homepage process step icons render", async ({ page }) => {
    await page.goto("/index.html");
    await page.locator(".process-steps").scrollIntoViewIfNeeded();
    await expect(page.locator(".process-step-icon svg").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".process-step-icon svg")).toHaveCount(3);
  });
});

test.describe("portfolio", () => {
  test("grid renders one card per portfolio item", async ({ page }) => {
    await page.goto("/portfolio.html");
    await expect(page.locator(".portfolio-card").first()).toBeVisible();

    const itemCount = await page.evaluate(async () => {
      const res = await fetch("data/portfolio.json");
      const data = await res.json();
      return data.items.length;
    });

    expect(itemCount).toBeGreaterThan(0);
    await expect(page.locator(".portfolio-card")).toHaveCount(itemCount);
  });

  test("lightbox opens on card click", async ({ page }) => {
    await page.goto("/portfolio.html");
    await page.locator('.portfolio-card[data-id="thumb-01"]').click();

    const lightbox = page.locator(".lightbox");
    await expect(lightbox).toHaveClass(/open/);
    await expect(lightbox).toHaveAttribute("aria-hidden", "false");

    const img = page.locator(".lightbox-image-wrap img");
    await expect(img).toHaveAttribute("src", /thumb-01\.jpg$/);

    await page.keyboard.press("Escape");
    await expect(lightbox).not.toHaveClass(/open/);
    await expect(lightbox).toHaveAttribute("aria-hidden", "true");
  });

  test("portfolio cards use distinct SVG assets, not only generic placeholder", async ({
    page,
  }) => {
    await page.goto("/portfolio.html");
    const srcA = await page
      .locator('.portfolio-card[data-id="thumb-01"] img')
      .getAttribute("src");
    const srcB = await page
      .locator('.portfolio-card[data-id="thumb-02"] img')
      .getAttribute("src");

    expect(srcA).toMatch(/thumb-01\.jpg/);
    expect(srcB).toMatch(/thumb-02\.png/);
    expect(srcA).not.toBe(srcB);
  });
});

test.describe("no admin", () => {
  test("admin entry is gone", async ({ page }) => {
    const response = await page.goto("/krishnanandg/");
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test("main site nav does not link to admin", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.locator('a[href*="krishnanandg"]')).toHaveCount(0);
  });
});

test.describe("contact", () => {
  test("pricing quote updates with quantity", async ({ page }) => {
    await page.goto("/contact.html");
    await expect(page.locator("#quote-total")).toContainText("$40*");

    await page.locator("#thumbnails").fill("5");
    await expect(page.locator("#quote-total")).toContainText("$200*");
  });

  test("contact form is present and wired to Formspree action", async ({ page }) => {
    await page.goto("/contact.html");
    const form = page.locator("#contact-form");
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute("action", "https://formspree.io/f/xlgkwzdn");
  });
});

test.describe("utilities", () => {
  test("Manimate.isPlaceholder distinguishes real assets from placeholder", async ({ page }) => {
    await page.goto("/index.html");
    const result = await page.evaluate(() => ({
      missing: Manimate.isPlaceholder(null),
      generic: Manimate.isPlaceholder("assets/placeholder-thumb.svg"),
      itemJpg: Manimate.isPlaceholder("assets/portfolio/thumb-01.jpg"),
    }));

    expect(result.missing).toBe(true);
    expect(result.generic).toBe(true);
    expect(result.itemJpg).toBe(false);
  });

  test("escapeHtml neutralizes script tags", async ({ page }) => {
    await page.goto("/index.html");
    const escaped = await page.evaluate(() =>
      escapeHtml('<script>alert("x")</script>')
    );
    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;");
  });
});
