/**
 * Builds assets/story/bobble-head.json — body + bobbling head for My Story hero.
 *
 * Run: node scripts/build-story-bobble-lottie.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const COMP_W = 1920;
const COMP_H = 1080;
const FPS = 60;
/** Base loop was 96 frames (~1.6s); stretch ~2.2× for slower, smoother bobble. */
const LOOP_FRAMES = 211;
const KEYFRAME_STEPS = 48;
const ROTATION_DEG_RIGHT = 10;
const ROTATION_DEG_LEFT = 3;

const BODY_SRC = path.join(root, "my_story_page", "image_one_body.png");
const HEAD_SRC = path.join(root, "my_story_page", "image_one_head.png");
const OUT_PATH = path.join(root, "assets", "story", "bobble-head.json");
const IMAGES_DIR = path.join(root, "assets", "story", "images");

/** Optional overrides in source pixels (+x right, +y down). */
const NECK_ANCHOR_SRC = null;
const HEAD_ANCHOR_SRC = null;
/** Fine-tune head placement in comp pixels after auto layout. */
const HEAD_NUDGE = [-40, 210];

function smoothKeyframe(t, degrees) {
  return {
    t,
    s: [degrees],
    i: { x: [0.42], y: [0] },
    o: { x: [0.58], y: [1] },
  };
}

function buildRotationKeyframes() {
  const steps = KEYFRAME_STEPS;
  const keyframes = [];

  for (let i = 0; i <= steps; i += 1) {
    const progress = i / steps;
    const frame = Math.round(progress * LOOP_FRAMES);
    const wave = Math.sin(progress * Math.PI * 2);
    const angle =
      wave >= 0 ? wave * ROTATION_DEG_RIGHT : wave * ROTATION_DEG_LEFT;
    keyframes.push(smoothKeyframe(frame, angle));
  }

  return { a: 1, k: keyframes };
}

function isSkinPixel(data, width, channels, x, y) {
  const i = (y * width + x) * channels;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return (
    r > 80 &&
    g > 40 &&
    b > 20 &&
    r > b &&
    g > b * 0.8 &&
    r < 240 &&
    !(r > 200 && g > 200 && b > 200)
  );
}

async function detectNeckAnchor(filePath, meta) {
  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
  const cx = Math.round(meta.width / 2);
  const rows = [];

  for (let y = Math.round(meta.height * 0.3); y < Math.round(meta.height * 0.78); y += 1) {
    let left = null;
    let right = null;
    for (let x = cx - 400; x < cx + 400; x += 1) {
      if (!isSkinPixel(data, info.width, info.channels, x, y)) continue;
      if (left === null) left = x;
      right = x;
    }
    if (left === null) continue;
    const width = right - left;
    if (width >= 320 && width <= 780) rows.push({ y, width });
  }

  if (!rows.length) {
    return [meta.width / 2, meta.height / 2];
  }

  return [cx, rows[0].y];
}

function imageAsset(id, width, height, fileName) {
  return {
    id,
    w: width,
    h: height,
    u: "images/",
    p: fileName,
    e: 0,
  };
}

function imageLayer({ ind, refId, name, width, height, anchor, position, rotation }) {
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: name,
    refId,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: rotation ?? { a: 0, k: 0 },
      p: { a: 0, k: [...position, 0] },
      a: { a: 0, k: [...anchor, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    ip: 0,
    op: LOOP_FRAMES,
    st: 0,
    bm: 0,
  };
}

async function loadSourceMeta(filePath) {
  const meta = await sharp(filePath).metadata();
  return { width: meta.width, height: meta.height };
}

async function writeWebpAsset(filePath, width, height, fileName) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const outPath = path.join(IMAGES_DIR, fileName);
  await sharp(filePath)
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 82, effort: 4, alphaQuality: 80 })
    .toFile(outPath);
  return fileName;
}

function bumpStoryLottieCacheVersion() {
  const storyLottieJs = path.join(root, "js", "story-lottie.js");
  if (!fs.existsSync(storyLottieJs)) return;

  let src = fs.readFileSync(storyLottieJs, "utf8");
  const version = Date.now();
  if (/bobble-head\.json\?v=\d+/.test(src)) {
    src = src.replace(/bobble-head\.json\?v=\d+/, `bobble-head.json?v=${version}`);
  } else {
    src = src.replace("assets/story/bobble-head.json", `assets/story/bobble-head.json?v=${version}`);
  }
  fs.writeFileSync(storyLottieJs, src);
}

async function main() {
  const [bodyMeta, headMeta] = await Promise.all([
    loadSourceMeta(BODY_SRC),
    loadSourceMeta(HEAD_SRC),
  ]);

  const bodyScale = COMP_H / bodyMeta.height;
  const bodyW = Math.round(bodyMeta.width * bodyScale);
  const bodyH = COMP_H;
  const bodyOffsetX = Math.round((COMP_W - bodyW) / 2);

  const headScale = bodyScale;
  const headW = Math.round(headMeta.width * headScale);
  const headH = Math.round(headMeta.height * headScale);

  const [detectedNeckX, detectedNeckY] = await detectNeckAnchor(BODY_SRC, bodyMeta);

  const neckSrc = NECK_ANCHOR_SRC ?? [detectedNeckX, detectedNeckY];
  const headAnchorSrc =
    HEAD_ANCHOR_SRC ?? [headMeta.width / 2, headMeta.height];

  const neckX = bodyOffsetX + neckSrc[0] * bodyScale;
  const neckY = neckSrc[1] * bodyScale;

  const headPos = [Math.round(neckX + HEAD_NUDGE[0]), Math.round(neckY + HEAD_NUDGE[1])];
  const headAnchor = [
    Math.round(headAnchorSrc[0] * headScale),
    Math.round(headAnchorSrc[1] * headScale),
  ];
  const bodyAnchor = [Math.round(bodyW / 2), Math.round(bodyH / 2)];
  const bodyPos = [Math.round(bodyOffsetX + bodyW / 2), Math.round(bodyH / 2)];

  const [bodyFile, headFile] = await Promise.all([
    writeWebpAsset(BODY_SRC, bodyW, bodyH, "bobble-body.webp"),
    writeWebpAsset(HEAD_SRC, headW, headH, "bobble-head.webp"),
  ]);

  const lottie = {
    v: "5.7.4",
    fr: FPS,
    ip: 0,
    op: LOOP_FRAMES,
    w: COMP_W,
    h: COMP_H,
    nm: "Kaalkine Story Bobble",
    ddd: 0,
    assets: [
      imageAsset("image_body", bodyW, bodyH, bodyFile),
      imageAsset("image_head", headW, headH, headFile),
    ],
    layers: [
      imageLayer({
        ind: 2,
        refId: "image_head",
        name: "Head",
        width: headW,
        height: headH,
        anchor: headAnchor,
        position: headPos,
        rotation: buildRotationKeyframes(),
      }),
      imageLayer({
        ind: 1,
        refId: "image_body",
        name: "Body",
        width: bodyW,
        height: bodyH,
        anchor: bodyAnchor,
        position: bodyPos,
      }),
    ],
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(lottie));
  bumpStoryLottieCacheVersion();

  const sizeMb = (fs.statSync(OUT_PATH).size / (1024 * 1024)).toFixed(2);
  console.log(`Neck anchor (src): ${neckSrc[0].toFixed(1)}, ${neckSrc[1].toFixed(1)}`);
  console.log(`Head anchor (src): ${headAnchorSrc[0].toFixed(1)}, ${headAnchorSrc[1].toFixed(1)}`);
  console.log(`Body: ${bodyW}x${bodyH} @ (${bodyPos[0]}, ${bodyPos[1]})`);
  console.log(`Head: ${headW}x${headH} anchor ${headAnchor.join(",")} @ (${headPos[0]}, ${headPos[1]})`);
  console.log(`Rotation: +${ROTATION_DEG_RIGHT}° / -${ROTATION_DEG_LEFT}° sine loop over ${LOOP_FRAMES} frames`);
  console.log(`Wrote ${OUT_PATH} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
