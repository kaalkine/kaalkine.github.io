/**
 * Manimate — placeholders & decorative visuals.
 * Thumbnails use a simple static 1920×1080 placeholder site-wide.
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
      ? (typeof escapeHtml === "function" ? escapeHtml(item.title) : item.title.replace(/"/g, "&quot;"))
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
      ? (typeof escapeHtml === "function" ? escapeHtml(item.title) : item.title.replace(/"/g, "&quot;"))
      : "";
    const alt = altText ? ` alt="${altText}"` : "";
    const w = options.width ? ` width="${options.width}"` : "";
    const h = options.height ? ` height="${options.height}"` : "";
    const lazy = options.lazy !== false ? ' loading="lazy"' : "";
    return `<img src="${item.image}"${alt}${w}${h}${lazy}>`;
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
        <img src="assets/story/second-image.png" alt="" class="story-doodle-img" width="6475" height="4829">
      </div>`;
  },

  renderStoryFace() {
    return `
      <div class="story-doodle story-doodle--face">
        <img src="assets/story/half-face.png" alt="" class="story-doodle-img" width="2669" height="7168">
      </div>`;
  },

  renderStoryPuzzle() {
    return `
      <div class="story-doodle story-doodle--puzzle">
        <img src="assets/story/last-image.png" alt="" class="story-doodle-img" width="3877" height="3272">
      </div>`;
  },
};

window.Manimate = Manimate;
