/**
 * Vector-traces the three My Story line-art illustrations into lightweight SVGs.
 *
 * The bobble-head (first visual) stays a Lottie animation and is untouched.
 * The other three illustrations are simple blue line-art, so they trace cleanly
 * and replace the multi-megabyte PNGs that made story.html slow to load.
 *
 *   - second-image / last-image are flat single-tone line art -> binary trace
 *     (accurate solid colour, tiny files).
 *   - half-face has two blue tones (dark outline + brighter skin shading) ->
 *     posterize so the shading is preserved.
 *
 * Run: npm run build:story-svg
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { trace, posterize } from "potrace";
import { optimize } from "svgo";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const STORY_DIR = path.join(root, "assets", "story");

/** Max width fed to the tracer: enough for smooth curves, small enough for tidy SVGs. */
const TRACE_WIDTH = 1100;

const SOURCES = [
  { src: "second-image.png", out: "second-image.svg", mode: "trace", color: "#1d5ee9" },
  { src: "last-image.png", out: "last-image.svg", mode: "trace", color: "#1f5de8" },
  { src: "half-face.png", out: "half-face.svg", mode: "posterize", color: "#1224cc" },
];

function resolveStoryPath(fileName) {
  return path.join(STORY_DIR, fileName);
}

/** Flatten transparency onto white so luminance-based tracing reads the blue lines. */
async function prepareRaster(srcPath) {
  return sharp(srcPath)
    .resize({ width: TRACE_WIDTH, withoutEnlargement: true })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();
}

function traceBinary(buffer, color) {
  return new Promise((resolve, reject) => {
    trace(
      buffer,
      {
        color,
        background: "transparent",
        turdSize: 4,
        optTolerance: 0.4,
        alphaMax: 1,
      },
      (err, svg) => (err ? reject(err) : resolve(svg))
    );
  });
}

function tracePosterized(buffer, color) {
  return new Promise((resolve, reject) => {
    posterize(
      buffer,
      {
        steps: 3,
        color,
        background: "transparent",
        fillStrategy: "dominant",
        rangeDistribution: "auto",
        // Drop tiny speckles and simplify curves to keep the SVG lightweight.
        turdSize: 30,
        optTolerance: 1.2,
        alphaMax: 1,
      },
      (err, svg) => (err ? reject(err) : resolve(svg))
    );
  });
}

function minifySvg(svg) {
  const result = optimize(svg, {
    multipass: true,
    plugins: [{ name: "preset-default" }, { name: "removeDimensions" }],
  });
  return result.data;
}

async function buildOne({ src, out, mode, color }) {
  const srcPath = resolveStoryPath(src);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Missing source illustration: ${path.relative(root, srcPath)}`);
  }

  const raster = await prepareRaster(srcPath);
  const traced =
    mode === "posterize" ? await tracePosterized(raster, color) : await traceBinary(raster, color);
  const optimized = minifySvg(traced);

  const outPath = resolveStoryPath(out);
  fs.writeFileSync(outPath, optimized);

  const srcKb = (fs.statSync(srcPath).size / 1024).toFixed(0);
  const outKb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`${src} (${srcKb} KB) -> ${out} (${outKb} KB) [${mode}]`);
}

async function main() {
  for (const entry of SOURCES) {
    await buildOne(entry);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
