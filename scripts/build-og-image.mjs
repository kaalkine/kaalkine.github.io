/**
 * Builds a 1200×630 social preview image from the first N portfolio thumbnails.
 * Used by Open Graph / Twitter Card / Reddit link previews.
 *
 * Run: npm run build:og-image
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const OG_W = 1200;
const OG_H = 630;
const BG = { r: 18, g: 17, b: 23 };
const PAD = 24;
const GAP = 10;
const HEADER = 52;
const COLS = 3;
const ROWS = 2;
const THUMB_COUNT = 6;
const RADIUS = 8;

const portfolio = JSON.parse(
  fs.readFileSync(path.join(root, "data/portfolio.json"), "utf8")
);
const site = JSON.parse(
  fs.readFileSync(path.join(root, "data/site.json"), "utf8")
);

const outDir = path.join(root, "assets", "og");
const outPath = path.join(outDir, "social-preview.jpg");

const gridW = OG_W - PAD * 2;
const gridH = OG_H - PAD * 2 - HEADER;
const cellW = Math.floor((gridW - GAP * (COLS - 1)) / COLS);
const cellH = Math.floor((gridH - GAP * (ROWS - 1)) / ROWS);

function roundedMask(w, h, r) {
  const svg = `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/></svg>`;
  return Buffer.from(svg);
}

async function thumbTile(imagePath, w, h) {
  const src = path.join(root, imagePath);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing thumbnail: ${imagePath}`);
  }

  const resized = await sharp(src)
    .resize(w, h, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  return sharp(resized)
    .composite([{ input: roundedMask(w, h, RADIUS), blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function headerRow() {
  const logoSize = 36;
  const logo = await sharp(path.join(root, site.brand.logo))
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const label = site.brand.tagline || "YouTube Thumbnail Expert";
  const svg = Buffer.from(`<svg width="${OG_W}" height="${HEADER}" xmlns="http://www.w3.org/2000/svg">
    <text x="68" y="34" font-family="system-ui,Segoe UI,sans-serif" font-weight="700" font-size="26" fill="#f5f5f7">${site.brand.name}</text>
    <text x="${68 + site.brand.name.length * 14 + 16}" y="34" font-family="system-ui,Segoe UI,sans-serif" font-weight="600" font-size="17" fill="#6E8DE8">${label}</text>
  </svg>`);

  const text = await sharp(svg).png().toBuffer();

  return [
    { input: logo, left: PAD, top: PAD + 6 },
    { input: text, left: 0, top: PAD },
  ];
}

async function main() {
  const items = portfolio.items.slice(0, THUMB_COUNT);
  if (items.length < THUMB_COUNT) {
    throw new Error(`Need at least ${THUMB_COUNT} portfolio items, found ${items.length}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const composites = await headerRow();

  for (let i = 0; i < items.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (cellW + GAP);
    const y = PAD + HEADER + row * (cellH + GAP);
    const tile = await thumbTile(items[i].image, cellW, cellH);
    composites.push({ input: tile, left: x, top: y });
  }

  await sharp({
    create: { width: OG_W, height: OG_H, channels: 3, background: BG },
  })
    .composite(composites)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outPath);

  console.log(`Wrote ${path.relative(root, outPath)} (${items.map((i) => i.id).join(", ")})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
