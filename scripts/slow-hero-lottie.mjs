/**
 * Re-times the built hero Lottie for slower, smoother icon motion.
 *
 * Run: node scripts/slow-hero-lottie.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stretchLottieTiming } from "./lottie-timing.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const HERO_JSON = path.join(root, "assets", "hero", "kaalkine-hero.json");
const HERO_LOTTIE_JS = path.join(root, "js", "hero-lottie.js");

/** ~5s → ~11s at 30fps, with eased keyframes. */
const TIME_STRETCH = 2.2;

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
  stretchLottieTiming(lottie, TIME_STRETCH, { soften: true });
  const after = lottie.op / lottie.fr;

  fs.writeFileSync(HERO_JSON, JSON.stringify(lottie));
  bumpLottieCacheVersion();

  const sizeMb = (fs.statSync(HERO_JSON).size / (1024 * 1024)).toFixed(2);
  console.log(`Hero timing: ${before.toFixed(2)}s → ${after.toFixed(2)}s (×${TIME_STRETCH})`);
  console.log(`Wrote ${HERO_JSON} (${sizeMb} MB)`);
}

main();
