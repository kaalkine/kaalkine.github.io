/**
 * Fully restores hero Lottie motion from the pristine template while keeping
 * the current Kaalkine portrait + hand image assets.
 *
 * Run: node scripts/restore-hero-lottie.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const TEMPLATE_CACHE = path.join(root, ".tmp-lottie-template.json");
const TEMPLATE_URL =
  "https://framerusercontent.com/assets/SvEjNJ4pCR9as0s1yg8zXf1E.json";
const HERO_JSON = path.join(root, "assets", "hero", "kaalkine-hero.json");
const HERO_LOTTIE_JS = path.join(root, "js", "hero-lottie.js");

const HAND_IN_POINT = 87;
const BULLSEYE_NUDGE = [6, 111, 0];
const HAND_NUDGE = [-28, 0, 0];

async function loadTemplate() {
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(TEMPLATE_CACHE, text);
  return JSON.parse(text);
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

async function main() {
  const current = JSON.parse(fs.readFileSync(HERO_JSON, "utf8"));
  const template = await loadTemplate();

  const handAsset = template.assets.find((a) => a.id === "image_0");
  const bodyAsset = template.assets.find((a) => a.id === "image_1");
  const curHand = current.assets.find((a) => a.id === "image_0");
  const curBody = current.assets.find((a) => a.id === "image_1");

  if (!handAsset || !bodyAsset || !curHand?.p || !curBody?.p) {
    throw new Error("Missing hand/body assets in template or current hero JSON");
  }

  handAsset.p = curHand.p;
  bodyAsset.p = curBody.p;

  const hand = getHandLayer(template);
  nudgeBullseye(template, hand);
  nudgeHand(hand);
  raiseHandAboveBody(template);
  hand.ip = HAND_IN_POINT;
  template.nm = "Kaalkine Hero";

  fs.writeFileSync(HERO_JSON, JSON.stringify(template));
  bumpLottieCacheVersion();

  const duration = template.op / template.fr;
  console.log(`Restored hero motion from fresh template (${duration.toFixed(2)}s @ ${template.fr}fps)`);
  console.log(`Kept Kaalkine portrait + hand images`);
  console.log(`Wrote ${HERO_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
