/* Quick visual check: screenshots all pages, logs console errors. */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:4173";
const shots = [
  { url: "/index.html", name: "check-home-desktop", width: 1440, height: 900, full: true, rm: true },
  { url: "/index.html", name: "check-home-viewport", width: 1440, height: 900, full: false, rm: false },
  { url: "/index.html", name: "check-home-mobile", width: 390, height: 844, full: true, rm: true },
  { url: "/portfolio.html", name: "check-portfolio-desktop", width: 1440, height: 900, full: false, rm: false },
  { url: "/story.html", name: "check-story-desktop", width: 1440, height: 900, full: true, rm: true },
  { url: "/contact.html", name: "check-contact-desktop", width: 1440, height: 900, full: true, rm: true },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
  if (s.rm) await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(BASE + s.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `test-results/${s.name}.png`, fullPage: s.full });
  console.log(`${s.name}: ${errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors"}`);
  await page.close();
}
await browser.close();
