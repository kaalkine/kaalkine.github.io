/**
 * Manimate — placeholders & decorative visuals.
 * Thumbnails use a simple static 1920×1080 placeholder site-wide.
 * Responsive images: AVIF + WebP with width descriptors, LQIP blur placeholders.
 */
const PLACEHOLDER_THUMB = "assets/placeholder-thumb.svg";

const Manimate = {
  hashHue(id) {
    let h = 0;
    const str = String(id || "placeholder");
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  },

  isPlaceholder(src) {
    if (!src) return true;
    const s = String(src);
    return s === PLACEHOLDER_THUMB || s.endsWith("/placeholder-thumb.svg");
  },

  truncate(text, max = 42) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  },

renderThumb(item, options = {}) {
    const alt = item.title
      ? (typeof escapeHtml === "function" ? escapeHtml(item.title) : item.title.replace(/"/g, '"'))
      : "Thumbnail placeholder";
    const extraClass = options.className ? ` ${options.className}` : "";
    const w = options.width ? ` width="${options.width}"` : ' width="1920"';
    const h = options.height ? ` height="${options.height}"` : ' height="1080"';
    const lazy = options.lazy !== false ? ' loading="lazy"' : "";
    return `<img src="${PLACEHOLDER_THUMB}" class="thumb-placeholder${extraClass}" alt="${alt}"${w}${h}${lazy}>`;
  },

  renderHeroScene() {
    return `<div class="hero-lottie" role="presentation" aria-hidden="true"></div>`;
  },

renderVisual(item, options = {}) {
    if (this.isPlaceholder(item.image) || item.image === PLACEHOLDER_THUMB) {
      return this.renderThumb(item, options);
    }
    const altText = item.title
      ? (typeof escapeHtml === "function" ? escapeHtml(item.title) : item.title.replace(/"/g, '"'))
      : "Portfolio thumbnail";
    const alt = altText ? ` alt="${altText}"` : "";
    const w = options.width ? ` width="${options.width}"` : "";
    const h = options.height ? ` height="${options.height}"` : "";
    const lazy = options.lazy !== false ? ' loading="lazy"' : "";
    const fetchPriority = options.priority ? ' fetchpriority="high"' : "";
    const responsive = options.responsive ? this.responsivePicture(item.image, options.context || "portfolio") : "";
    const lqip = options.responsive && options.lqip !== false ? this.lqipStyle(item.image) : "";
    return `<picture${lqip}>${responsive}<img src="${item.image}"${alt}${w}${h}${lazy}${fetchPriority} decoding="async"></picture>`;
  },

  /** Build <picture> with AVIF + WebP sources and context-aware sizes. */
  responsivePicture(image, context = "portfolio") {
    if (!/\.(webp|jpe?g|png)$/i.test(image)) return "";
    const base = image.replace(/\.(webp|jpe?g|png)$/i, "");
    const sizes = this.getSizes(context);
    const avifSrcset = `${base}-400.avif 400w, ${base}-800.avif 800w, ${base}-1280.avif 1280w, ${base}-1920.avif 1920w, ${base}-2560.avif 2560w`;
    const webpSrcset = `${base}-400.webp 400w, ${base}-800.webp 800w, ${base}-1280.webp 1280w, ${base}-1920.webp 1920w, ${base}-2560.webp 2560w`;
    return `
      <source type="image/avif" srcset="${avifSrcset}" sizes="${sizes}">
      <source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">
    `.trim();
  },

  getSizes(context) {
    switch (context) {
      case "portfolio":
        return "(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 20vw";
      case "homepage-wall":
        return "(max-width: 520px) 50vw, (max-width: 900px) 33vw, 16.66vw";
      case "lightbox":
        return "90vw";
      case "why-hire":
        return "(max-width: 800px) 50vw, 33vw";
      default:
        return "(max-width: 600px) 50vw, (max-width: 960px) 33vw, 320px";
    }
  },

  lqipStyle(image) {
    if (!/\.(webp|jpe?g|png)$/i.test(image)) return "";
    const base = image.replace(/\.(webp|jpe?g|png)$/i, "");
    return ` style="--lqip: var(--lqip-${base.replace(/.*\//, "")})"`;
  },

  storyHueVars(id) {
    const hue = this.hashHue(id);
    const hue2 = (hue + 48) % 360;
    return `style="--thumb-hue: ${hue}; --thumb-hue2: ${hue2}"`;
  },

  renderStoryIllustration(type, id = "story") {
    const vars = this.storyHueVars(id);
    const renderers = {
      portrait: () => this.renderStoryPortrait(vars),
      path: () => this.renderStoryPath(vars),
      face: () => this.renderStoryFace(vars),
      puzzle: () => this.renderStoryPuzzle(vars),
    };
    return (renderers[type] || renderers.portrait)();
  },

  renderStoryPortrait() {
    return `
      <div class="story-doodle story-doodle--portrait">
        <div class="story-bobble-lottie" role="presentation" aria-hidden="true"></div>
      </div>`;
  },

  renderStoryPath() {
    return `
      <div class="story-doodle story-doodle--path">
        <img src="assets/story/second-image.svg" alt="" class="story-doodle-img" loading="lazy" decoding="async">
      </div>`;
  },

  renderStoryFace() {
    return `
      <div class="story-doodle story-doodle--face">
        <img src="assets/story/half-face.svg" alt="" class="story-doodle-img" loading="lazy" decoding="async">
      </div>`;
  },

  renderStoryPuzzle() {
    return `
      <div class="story-doodle story-doodle--puzzle">
        <img src="assets/story/last-image.svg" alt="" class="story-doodle-img" loading="lazy" decoding="async">
      </div>`;
  },
};

window.Manimate = Manimate;
