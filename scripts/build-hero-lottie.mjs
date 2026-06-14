/**
 * Builds assets/hero/kaalkine-hero.json by swapping portrait + hand
 * into the reference Lottie template (same motion timing / UI layers).
 *
 * Sources: data/admin-config.json → heroPortraitPath, heroHandPath
 *
 * Run: npm run build:hero-lottie
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const TEMPLATE_URL =
  "https://framerusercontent.com/assets/SvEjNJ4pCR9as0s1yg8zXf1E.json";
const TEMPLATE_CACHE = path.join(root, ".tmp-lottie-template.json");
const OUT_PATH = path.join(root, "assets", "hero", "kaalkine-hero.json");
const CONFIG_PATH = path.join(root, "data", "admin-config.json");

const HAND_IN_POINT = 87;
/** Hand-local nudge on template bullseye (+x right, +y down; ~0.53× on screen). */
const BULLSEYE_NUDGE = [6, 111, 0];
/** Nudge hand + bullseye together in parent space (+x right, +y down). */
const HAND_NUDGE = [-28, 0, 0];

const DEFAULTS = {
  heroPortraitPath: "me_plus_hand/justGUY.png",
  heroHandPath: "me_plus_hand/justHAND.png",
};

function resolveProjectPath(relPath) {
  return path.join(root, relPath.replace(/\//g, path.sep));
}

function loadHeroConfig() {
  const cfg = fs.existsSync(CONFIG_PATH)
    ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"))
    : {};

  return {
    portraitPath: resolveProjectPath(cfg.heroPortraitPath || DEFAULTS.heroPortraitPath),
    handPath: resolveProjectPath(cfg.heroHandPath || DEFAULTS.heroHandPath),
  };
}

function requireSourceFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing ${label} at ${filePath}. Add the file or set its path in data/admin-config.json.`
    );
  }
  return filePath;
}

async function loadTemplate({ fresh = false } = {}) {
  if (!fresh && fs.existsSync(TEMPLATE_CACHE)) {
    return JSON.parse(fs.readFileSync(TEMPLATE_CACHE, "utf8"));
  }

  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(TEMPLATE_CACHE, text);
  return JSON.parse(text);
}

async function pngToDataUri(filePath, width, height) {
  const buffer = await sharp(filePath)
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function offsetVec3(vec, delta) {
  return [vec[0] + delta[0], vec[1] + delta[1], (vec[2] ?? 0) + (delta[2] ?? 0)];
}

function offsetPositionKeyframes(posProp, delta) {
  if (!posProp?.k) return;
  const { k } = posProp;
  if (Array.isArray(k) && k.length && Object.prototype.hasOwnProperty.call(k[0], "s")) {
    k.forEach((kf) => {
      if (kf.s) kf.s = offsetVec3(kf.s, delta);
    });
    return;
  }
  if (Array.isArray(k) && typeof k[0] === "number") {
    posProp.k = offsetVec3(k, delta);
  }
}

function getHandLayer(lottie) {
  return lottie.layers.find((l) => l.refId === "image_0");
}

function getBullseyeLayers(lottie, hand) {
  return lottie.layers.filter((l) => l.parent === hand.ind && l.ty === 4);
}

function nudgeHand(hand) {
  if (!HAND_NUDGE.some((v) => v !== 0)) return;
  offsetPositionKeyframes(hand.ks?.p, HAND_NUDGE);
}

function nudgeBullseye(lottie, hand) {
  if (!BULLSEYE_NUDGE.some((v) => v !== 0)) return;

  getBullseyeLayers(lottie, hand).forEach((layer) => {
    offsetPositionKeyframes(layer.ks?.p, BULLSEYE_NUDGE);
  });
}

function bumpLottieCacheVersion() {
  const heroLottieJs = path.join(root, "js", "hero-lottie.js");
  let src = fs.readFileSync(heroLottieJs, "utf8");
  const version = Date.now();
  if (/kaalkine-hero\.json\?v=\d+/.test(src)) {
    src = src.replace(/kaalkine-hero\.json\?v=\d+/, `kaalkine-hero.json?v=${version}`);
  } else {
    src = src.replace(
      "assets/hero/kaalkine-hero.json",
      `assets/hero/kaalkine-hero.json?v=${version}`
    );
  }
  fs.writeFileSync(heroLottieJs, src);
}

function setHandInPoint(hand) {
  hand.ip = HAND_IN_POINT;
}

function raiseHandAboveBody(lottie) {
  const hand = getHandLayer(lottie);
  if (!hand?.parent) return;

  const shapes = getBullseyeLayers(lottie, hand).sort(
    (a, b) => lottie.layers.indexOf(a) - lottie.layers.indexOf(b)
  );
  const toMove = [hand, ...shapes];

  for (const layer of [...toMove].reverse()) {
    const idx = lottie.layers.indexOf(layer);
    if (idx >= 0) lottie.layers.splice(idx, 1);
  }

  const parentInd = hand.parent;
  let insertAfter = -1;
  lottie.layers.forEach((layer, idx) => {
    if (layer.parent !== parentInd) return;
    insertAfter = Math.max(insertAfter, idx);
  });

  if (insertAfter < 0) return;
  lottie.layers.splice(insertAfter + 1, 0, ...toMove);
}

function formatSourceLabel(filePath) {
  const rel = path.relative(root, filePath);
  const mtime = fs.statSync(filePath).mtime.toISOString();
  return `${rel} (${mtime})`;
}

async function main() {
  const sources = loadHeroConfig();
  const portraitSrc = requireSourceFile(sources.portraitPath, "hero portrait (body)");
  const handSrc = requireSourceFile(sources.handPath, "hero hand");

  const lottie = await loadTemplate({ fresh: true });
  const handAsset = lottie.assets.find((a) => a.id === "image_0");
  const bodyAsset = lottie.assets.find((a) => a.id === "image_1");

  if (!handAsset || !bodyAsset) {
    throw new Error("Template missing image_0 or image_1 assets");
  }

  bodyAsset.p = await pngToDataUri(portraitSrc, bodyAsset.w, bodyAsset.h);
  handAsset.p = await pngToDataUri(handSrc, handAsset.w, handAsset.h);

  const hand = getHandLayer(lottie);
  nudgeBullseye(lottie, hand);
  nudgeHand(hand);
  raiseHandAboveBody(lottie);
  setHandInPoint(hand);

  lottie.nm = "Kaalkine Hero";

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(lottie));
  bumpLottieCacheVersion();

  const sizeMb = (fs.statSync(OUT_PATH).size / (1024 * 1024)).toFixed(2);
  console.log(`Portrait (body): ${formatSourceLabel(portraitSrc)}`);
  console.log(`Hand: ${formatSourceLabel(handSrc)}`);
  console.log(`Bullseye nudge (hand-local): ${BULLSEYE_NUDGE[0]}, ${BULLSEYE_NUDGE[1]}`);
  console.log(`Hand nudge (parent local): ${HAND_NUDGE[0]}, ${HAND_NUDGE[1]}`);
  console.log(`Hand in-point: frame ${HAND_IN_POINT}`);
  console.log(`Wrote ${OUT_PATH} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
