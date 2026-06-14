/**
 * Builds kaalkine-logo.svg from tosvgNOW.svg:
 * - Removes white/near-white matte paths at the canvas edges
 * - Keeps inner white highlights (#FEFFFF) in the logo mark
 * - Bumps logo cache version when changed
 *
 * Run: npm run optimize:brand-logo
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "assets", "brand", "tosvgNOW.svg");
const logoPath = path.join(root, "assets", "brand", "kaalkine-logo.svg");
const sitePath = path.join(root, "data", "site.json");
const adminConfigPath = path.join(root, "data", "admin-config.json");

/** Edge matte fills from vector export — not part of the logo mark. */
const EDGE_MATTE_FILLS = new Set(["#ffffff", "#fefeff", "#ebf0f7", "#67e6f5"]);

function normalizeFill(fill) {
  return fill.trim().toLowerCase();
}

function isEdgeMattePath(pathTag) {
  const fillMatch = pathTag.match(/fill="([^"]+)"/i);
  if (!fillMatch) return false;
  return EDGE_MATTE_FILLS.has(normalizeFill(fillMatch[1]));
}

function removeEdgeMattePaths(svg) {
  const before = (svg.match(/<path/g) || []).length;
  let removed = 0;

  const cleaned = svg.replace(/<path[\s\S]*?z"\s*\/>/gi, (pathTag) => {
    if (!isEdgeMattePath(pathTag)) return pathTag;
    removed += 1;
    return "";
  });

  return { svg: cleaned, removed, before, after: (cleaned.match(/<path/g) || []).length };
}

function normalizeSvgRoot(svg) {
  return svg.replace(
    /<svg[\s\S]*?>/,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2024" role="img" aria-hidden="true">'
  );
}

function bumpLogoVersion() {
  const version = String(Date.now());
  const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
  site.brand = site.brand || {};
  site.brand.logo = "assets/brand/kaalkine-logo.svg";
  site.brand.logoVersion = version;
  fs.writeFileSync(sitePath, `${JSON.stringify(site, null, 2)}\n`);

  if (fs.existsSync(adminConfigPath)) {
    const adminConfig = JSON.parse(fs.readFileSync(adminConfigPath, "utf8"));
    adminConfig.brandLogoPath = "assets/brand/kaalkine-logo.svg";
    fs.writeFileSync(adminConfigPath, `${JSON.stringify(adminConfig, null, 2)}\n`);
  }

  const htmlFiles = [
    "index.html",
    "portfolio.html",
    "story.html",
    "contact.html",
    "krishnanandg/index.html",
  ];

  for (const rel of htmlFiles) {
    const filePath = path.join(root, rel);
    if (!fs.existsSync(filePath)) continue;
    let html = fs.readFileSync(filePath, "utf8");
    html = html.replace(
      /assets\/brand\/kaalkine-logo\.svg(?:\?v=[^"']+)?/g,
      `assets/brand/kaalkine-logo.svg?v=${version}`
    );
    html = html.replace(
      /\.\.\/assets\/brand\/kaalkine-logo\.svg(?:\?v=[^"']+)?/g,
      `../assets/brand/kaalkine-logo.svg?v=${version}`
    );
    fs.writeFileSync(filePath, html);
  }

  return version;
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source logo not found: ${sourcePath}`);
  }

  let svg = fs.readFileSync(sourcePath, "utf8");
  const { svg: withoutMatte, removed, before, after } = removeEdgeMattePaths(svg);
  svg = normalizeSvgRoot(withoutMatte);
  fs.writeFileSync(logoPath, svg);

  const version = bumpLogoVersion();

  console.log(`Built ${logoPath} from ${sourcePath}`);
  if (removed > 0) {
    console.log(`Removed ${removed} edge matte path(s) (${before} -> ${after} paths).`);
  } else {
    console.log("No edge matte paths found — logo background is already transparent.");
  }
  console.log(`Cache version: ${version}`);
}

main();
