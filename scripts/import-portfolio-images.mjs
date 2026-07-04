/**
 * Import portfolio images from the user's Desktop folder into assets/portfolio/.
 * Maps numbered files to thumb-XX, wall folder to wall-XX, why folder to why-XX.
 *
 * Run: node scripts/import-portfolio-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "assets", "portfolio");
const SRC = path.join(process.env.USERPROFILE || "", "OneDrive", "Desktop", "portfolio images");

const PORTFOLIO_PAGE = path.join(SRC, "portfolioPage");
const THUMB_WALL = path.join(SRC, "thumbnail wall");
const WHY_HIRE = path.join(SRC, "why_you_should_hire");

const VARIANT_RE = /-\d+\.(webp|avif)$/i;
const LQIP_RE = /-lqip\.(webp|css)$/i;

function ext(file) {
  return path.extname(file).toLowerCase();
}

function copy(src, destName) {
  const dest = path.join(OUT, destName);
  const base = destName.replace(/\.(jpe?g|png|webp)$/i, "");
  // Drop stale same-id sources from earlier imports (e.g. thumb-14.jpg + thumb-14.png).
  for (const name of fs.readdirSync(OUT)) {
    if (name.startsWith(base + ".") && /\.(jpe?g|png|webp)$/i.test(name) && name !== destName) {
      fs.unlinkSync(path.join(OUT, name));
      purgeVariants(base);
    }
  }
  fs.copyFileSync(src, dest);
  console.log(`  ${path.basename(src)} → ${destName}`);
  return destName;
}

function purgeVariants(base) {
  if (!fs.existsSync(OUT)) return;
  for (const name of fs.readdirSync(OUT)) {
    if (name.startsWith(base + "-") && (VARIANT_RE.test(name) || LQIP_RE.test(name))) {
      fs.unlinkSync(path.join(OUT, name));
    }
  }
  const lqipDir = path.join(OUT, ".lqip");
  if (fs.existsSync(lqipDir)) {
    for (const name of fs.readdirSync(lqipDir)) {
      if (name.startsWith(base + "-lqip")) {
        fs.unlinkSync(path.join(lqipDir, name));
      }
    }
  }
}

function portfolioPageSortKey(filename) {
  const parenMatch = filename.match(/^(\d+)\s*\((\d+)\)/);
  if (parenMatch) {
    const base = parseInt(parenMatch[1], 10);
    const variant = parseInt(parenMatch[2], 10);
    return base - 0.5 + variant / 100;
  }
  const numMatch = filename.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 1000;
}

function portfolioPageFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => {
      const keyA = portfolioPageSortKey(a);
      const keyB = portfolioPageSortKey(b);
      if (keyA !== keyB) return keyA - keyB;
      if (keyA >= 1000) return a.localeCompare(b, undefined, { sensitivity: "base" });
      return 0;
    });
}

function numberedFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d+\./.test(f))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

function allImageFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

/** Fingerprint at grid display size to skip duplicate source images. */
async function imageFingerprint(filePath) {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(filePath).metadata();
  const targetWidth = Math.min(400, meta.width || 400);
  const buf = await sharp(filePath)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();
  return buf.toString("hex");
}

if (!fs.existsSync(SRC)) {
  console.error(`Source folder not found: ${SRC}`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

const portfolioUpdates = [];

console.log("\nportfolioPage → thumb-XX (folder order: 1…7, 8 (2), 8…15, then named)");
const pageFiles = portfolioPageFiles(PORTFOLIO_PAGE);
const seenFingerprints = new Set();
let thumbIndex = 0;
for (const file of pageFiles) {
  const srcPath = path.join(PORTFOLIO_PAGE, file);
  const fingerprint = await imageFingerprint(srcPath);
  if (seenFingerprints.has(fingerprint)) {
    console.log(`  skip duplicate: ${file}`);
    continue;
  }
  seenFingerprints.add(fingerprint);
  thumbIndex += 1;
  const pad = String(thumbIndex).padStart(2, "0");
  const dest = `thumb-${pad}${ext(file)}`;
  purgeVariants(`thumb-${pad}`);
  copy(srcPath, dest);
  portfolioUpdates.push({ id: `thumb-${pad}`, image: `assets/portfolio/${dest}` });
}

const wallPaths = [];
console.log("\nthumbnail wall → wall-XX");
allImageFiles(THUMB_WALL).forEach((file, i) => {
  const pad = String(i + 1).padStart(2, "0");
  const dest = `wall-${pad}${ext(file)}`;
  purgeVariants(`wall-${pad}`);
  copy(path.join(THUMB_WALL, file), dest);
  wallPaths.push(`assets/portfolio/${dest}`);
});

const whyPaths = [];
console.log("\nwhy_you_should_hire → why-XX");
numberedFiles(WHY_HIRE).forEach((file) => {
  const n = parseInt(file, 10);
  const pad = String(n).padStart(2, "0");
  const dest = `why-${pad}${ext(file)}`;
  purgeVariants(`why-${pad}`);
  copy(path.join(WHY_HIRE, file), dest);
  whyPaths[n - 1] = `assets/portfolio/${dest}`;
});

// Update portfolio.json — full portfolioPage order (1…32), no homepage dedupe.
const portfolioPath = path.join(root, "data", "portfolio.json");
const portfolio = JSON.parse(fs.readFileSync(portfolioPath, "utf8"));
const dateById = Object.fromEntries(portfolio.items.map((item) => [item.id, item.date]));

portfolio.items = portfolioUpdates.map((item, i) => ({
  id: item.id,
  image: item.image,
  order: i + 1,
  date: dateById[item.id] || "2026-03-01",
}));
fs.writeFileSync(portfolioPath, JSON.stringify(portfolio, null, 2) + "\n");
console.log(`\nUpdated ${portfolioPath} (${portfolio.items.length} items, portfolioPage order)`);

// Update site.json
const sitePath = path.join(root, "data", "site.json");
const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
site.homepageWall = wallPaths;
if (site.whyHire?.pillars) {
  site.whyHire.pillars = site.whyHire.pillars.map((pillar, i) => {
    const next = { ...pillar };
    if (whyPaths[i]) {
      next.image = whyPaths[i];
      delete next.portfolioItemId;
      delete next.imageIndex;
    }
    return next;
  });
}
fs.writeFileSync(sitePath, JSON.stringify(site, null, 2) + "\n");
console.log(`Updated ${sitePath}`);
console.log("\nDone. Run: npm run build:thumb-sizes");
