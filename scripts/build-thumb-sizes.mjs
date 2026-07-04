/**
 * Generates responsive webp + avif variants for raster portfolio thumbnails.
 *
 * Drop a full-res thumbnail (e.g. assets/portfolio/foo.webp|jpg|png), run this,
 * and it writes multiple width variants. The grid (js/manimate.js renderVisual)
 * builds a srcset from those names automatically.
 *
 * SVG placeholders are skipped (vectors scale for free). Already-generated
 * variants are skipped so re-runs are cheap.
 *
 * Run: npm run build:thumb-sizes
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PORTFOLIO_DIR = path.join(root, "assets", "portfolio");

const WEBP_WIDTHS = [400, 800, 1280, 1920, 2560];
const AVIF_WIDTHS = [400, 800, 1280, 1920, 2560];
const LQIP_WIDTH = 20;

const WEBP_QUALITY = { 400: 85, 800: 85, 1280: 90, 1920: 90, 2560: 90 };
const AVIF_QUALITY = { 400: 65, 800: 65, 1280: 65, 1920: 65, 2560: 65 };

const RASTER_RE = /\.(webp|jpe?g|png)$/i;
const VARIANT_RE = /-(\d+)\.(webp|avif)$/i;

const LQIP_DIR = path.join(PORTFOLIO_DIR, ".lqip");

function sourceFiles() {
  if (!fs.existsSync(PORTFOLIO_DIR)) return [];
  return fs
    .readdirSync(PORTFOLIO_DIR)
    .filter((name) => RASTER_RE.test(name) && !VARIANT_RE.test(name));
}

function fileExists(fileName) {
  return fs.existsSync(path.join(PORTFOLIO_DIR, fileName));
}

function isStaleVariant(sourcePath, outName) {
  const outPath = path.join(PORTFOLIO_DIR, outName);
  if (!fs.existsSync(outPath)) return true;
  return fs.statSync(sourcePath).mtimeMs > fs.statSync(outPath).mtimeMs;
}

async function buildWebpVariants(fileName, base, meta) {
  for (const width of WEBP_WIDTHS) {
    const outName = `${base}-${width}.webp`;
    if (!isStaleVariant(fileName, outName)) continue;
    const targetWidth = meta.width ? Math.min(width, meta.width) : width;
    await sharp(fileName)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY[width], effort: 4 })
      .toFile(path.join(PORTFOLIO_DIR, outName));
    const kb = (fs.statSync(path.join(PORTFOLIO_DIR, outName)).size / 1024).toFixed(0);
    console.log(`  ${outName} (${kb} KB)`);
  }
}

async function buildAvifVariants(fileName, base, meta) {
  for (const width of AVIF_WIDTHS) {
    const outName = `${base}-${width}.avif`;
    if (!isStaleVariant(fileName, outName)) continue;
    const targetWidth = meta.width ? Math.min(width, meta.width) : width;
    await sharp(fileName)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .avif({ quality: AVIF_QUALITY[width], effort: 4 })
      .toFile(path.join(PORTFOLIO_DIR, outName));
    const kb = (fs.statSync(path.join(PORTFOLIO_DIR, outName)).size / 1024).toFixed(0);
    console.log(`  ${outName} (${kb} KB)`);
  }
}

async function buildLqip(fileName, base, meta) {
  const outName = `${base}-lqip.webp`;
  const outPath = path.join(LQIP_DIR, outName);
  if (fs.existsSync(outPath) && fs.statSync(fileName).mtimeMs <= fs.statSync(outPath).mtimeMs) return;
  const targetWidth = Math.min(LQIP_WIDTH, meta.width || LQIP_WIDTH);
  await sharp(fileName)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality: 30, effort: 6 })
    .toFile(outPath);
  const base64 = fs.readFileSync(outPath).toString("base64");
  const dataUri = `data:image/webp;base64,${base64}`;
  const cssVarPath = path.join(LQIP_DIR, `${base}-lqip.css`);
  fs.writeFileSync(cssVarPath, `--lqip: url("${dataUri}");\n`);
  console.log(`  ${outName} (LQIP generated)`);
}

async function main() {
  const files = sourceFiles();
  if (!files.length) {
    console.log("No raster source thumbnails in assets/portfolio/. Nothing to do.");
    return;
  }
  fs.mkdirSync(LQIP_DIR, { recursive: true });
  for (const file of files) {
    console.log(file);
    const srcPath = path.join(PORTFOLIO_DIR, file);
    const base = file.replace(RASTER_RE, "");
    const meta = await sharp(srcPath).metadata();

    await Promise.all([
      buildWebpVariants(srcPath, base, meta),
      buildAvifVariants(srcPath, base, meta),
      buildLqip(srcPath, base, meta),
    ]);
  }
  console.log(`Done. ${files.length} source thumbnail(s) processed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
