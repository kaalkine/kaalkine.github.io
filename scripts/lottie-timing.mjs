/**
 * Stretch Lottie timeline + soften keyframe easing for smoother, slower motion.
 */

export const SMOOTH_EASE_IN = { x: [0.42], y: [0.0] };
export const SMOOTH_EASE_OUT = { x: [0.58], y: [1.0] };

export function softenKeyframeEasing(prop) {
  if (!prop || prop.a !== 1 || !Array.isArray(prop.k)) return;

  for (const kf of prop.k) {
    if (typeof kf.t !== "number" || !kf.i || !kf.o) continue;
    kf.i = { x: [...SMOOTH_EASE_IN.x], y: [...SMOOTH_EASE_IN.y] };
    kf.o = { x: [...SMOOTH_EASE_OUT.x], y: [...SMOOTH_EASE_OUT.y] };
  }
}

export function scaleKeyframes(prop, factor) {
  if (!prop || prop.a !== 1 || !Array.isArray(prop.k)) return;

  for (const kf of prop.k) {
    if (typeof kf.t === "number") {
      kf.t = Math.round(kf.t * factor);
    }
  }
}

export function processLayerTiming(layer, factor, { soften = true } = {}) {
  if (layer.ip != null) layer.ip = Math.round(layer.ip * factor);
  if (layer.op != null) layer.op = Math.round(layer.op * factor);
  if (layer.st != null) layer.st = Math.round(layer.st * factor);

  if (!layer.ks) return;

  for (const prop of Object.values(layer.ks)) {
    scaleKeyframes(prop, factor);
    if (soften) softenKeyframeEasing(prop);
  }
}

export function stretchLottieTiming(lottie, factor, { soften = true } = {}) {
  if (!lottie || factor === 1) return lottie;

  lottie.op = Math.round(lottie.op * factor);

  for (const layer of lottie.layers ?? []) {
    processLayerTiming(layer, factor, { soften });
  }

  for (const asset of lottie.assets ?? []) {
    if (!asset.layers) continue;
    for (const layer of asset.layers) {
      processLayerTiming(layer, factor, { soften });
    }
  }

  return lottie;
}
