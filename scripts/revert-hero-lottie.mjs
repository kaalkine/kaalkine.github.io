/**
 * Reverts hero Lottie timing stretch (undoes slow-hero-lottie 2.2×).
 *
 * Run: node scripts/revert-hero-lottie.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stretchLottieTiming } from "./lottie-timing.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const HERO_JSON = path.join(root, "assets", "hero", "kaalkine-hero.json");
const HERO_LOTTIE_JS = path.join(root, "js", "hero-lottie.js");
const ORIGINAL_STRETCH = 2.2;

function bumpLottieCacheVersion() {
  let src = fs.readFileSync(HERO_LOTTIE_JS, "utf8");
  const version = Date.now();
  if (/kaalkine-hero\.json\?v=\d+/.test(src)) {
    src = src.replace(/kaalkine-hero\.json\?v=\d+/, `kaalkine-hero.json?v=${version}`);
  } else {
    src = src.replace("assets/hero/kaalkine-hero.json", `assets/hero/kaalkine-hero.json?v=${version}`);
  }
  fs.writeFileSync(HERO_LOTTIE_JS, src);
}

function main() {
  const lottie = JSON.parse(fs.readFileSync(HERO_JSON, "utf8"));
  const before = lottie.op / lottie.fr;
  stretchLottieTiming(lottie, 1 / ORIGINAL_STRETCH, { soften: false });
  const after = lottie.op / lottie.fr;

  fs.writeFileSync(HERO_JSON, JSON.stringify(lottie));
  bumpLottieCacheVersion();

  console.log(`Hero timing reverted: ${before.toFixed(2)}s → ${after.toFixed(2)}s (÷${ORIGINAL_STRETCH})`);
}

main();
