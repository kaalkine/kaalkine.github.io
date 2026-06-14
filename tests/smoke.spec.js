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
  test("grid renders 60 items", async ({ page }) => {
    await page.goto("/portfolio.html");
    await expect(page.locator(".portfolio-card").first()).toBeVisible();
    await expect(page.locator(".portfolio-card")).toHaveCount(60);
  });

  test("niche filter reduces visible items", async ({ page }) => {
    await page.goto("/portfolio.html");
    await expect(page.locator(".portfolio-card").first()).toBeVisible({ timeout: 10000 });
    const allCount = await page.locator(".portfolio-card").count();
    expect(allCount).toBe(60);

    await page.locator(".portfolio-sort-trigger").click();
    await page.locator('.portfolio-sort-option[data-value="Sports"]').click();

    const filteredCount = await page.locator(".portfolio-card").count();
    expect(filteredCount).toBeLessThan(allCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test("lightbox variant tabs switch the image", async ({ page }) => {
    await page.goto("/portfolio.html");
    await page.locator('.portfolio-card[data-id="thumb-01"]').click();

    const lightbox = page.locator(".lightbox");
    await expect(lightbox).toHaveClass(/open/);
    await expect(lightbox).toHaveAttribute("aria-hidden", "false");

    const img = page.locator(".lightbox-image-wrap img");
    await expect(img).toHaveAttribute("src", /thumb-01\.svg$/);

    await page.locator(".variant-tab", { hasText: "B" }).click();
    await expect(img).toHaveAttribute("src", /thumb-01b\.svg$/);

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

    expect(srcA).toMatch(/thumb-01\.svg/);
    expect(srcB).toMatch(/thumb-02\.svg/);
    expect(srcA).not.toBe(srcB);
  });
});

test.describe("admin", () => {
  test("/krishnanandg/ loads unlock gate without site nav", async ({ page }) => {
    await page.goto("/krishnanandg/");
    await expect(page.locator("#admin-gate")).toBeVisible();
    await expect(page.locator("#admin-shell")).toBeHidden();
    await expect(page.locator("#admin-auth-form button[type='submit']")).toContainText(/unlock/i);
    await expect(page.locator("nav.nav-links")).toHaveCount(0);
  });

  test("main site nav does not link to admin", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.locator('a[href*="krishnanandg"]')).toHaveCount(0);
  });
});

test.describe("portfolio channel display", () => {
  test("showChannel false hides client on portfolio card", async ({ page }) => {
    await page.goto("/portfolio.html");
    const card = page.locator('.portfolio-card[data-id="thumb-16"]');
    await expect(card).toBeVisible();
    await expect(card.locator(".portfolio-card-client")).toHaveCount(0);
    await expect(card.locator(".portfolio-card-avatar")).toHaveCount(0);
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
      itemSvg: Manimate.isPlaceholder("assets/portfolio/thumb-01.svg"),
    }));

    expect(result.missing).toBe(true);
    expect(result.generic).toBe(true);
    expect(result.itemSvg).toBe(false);
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
