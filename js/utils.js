/** Shared helpers for escaping and safe attribute values */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

/** Allow hex (#rgb, #rrggbb) and simple named-safe tokens only */
function safeCssColor(color, fallback = "#305CDE") {
  if (!color) return fallback;
  const s = String(color).trim();
  if (/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(s)) return s;
  return fallback;
}

function showSiteError(message) {
  let banner = document.querySelector(".site-error-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "site-error-banner";
    banner.setAttribute("role", "alert");
    document.body.prepend(banner);
  }
  banner.textContent = message;
  banner.hidden = false;
}

function queryEl(selector, context = document) {
  return context.querySelector(selector);
}

function queryRequired(selector, context = document) {
  const el = context.querySelector(selector);
  if (!el) throw new Error(`Missing required element: ${selector}`);
  return el;
}

function buildSparkCtaSparks(count = 22) {
  const tones = ["white", "gold", "cyan", "ember"];
  const sparks = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (360 / count) * i + ((i * 17) % 11) - 5;
    const delay = ((i * 0.11) % 2.4).toFixed(2);
    const duration = (1.15 + (i % 5) * 0.22).toFixed(2);
    const distance = 34 + (i % 7) * 7;
    const tone = tones[i % tones.length];
    const streak = i % 6 === 0 ? " spark-cta-spark--streak" : "";
    sparks.push(
      `<span class="spark-cta-spark spark-cta-spark--${tone}${streak}" style="--spark-angle:${angle}deg;--spark-delay:${delay}s;--spark-duration:${duration}s;--spark-distance:${distance}px"></span>`
    );
  }
  return `<span class="spark-cta-sparks" aria-hidden="true">${sparks.join("")}</span>`;
}

function buildSparkCtaButton(href, label, options = {}) {
  const { variant = "accent", external = false, extraClass = "" } = options;
  const variantClass = variant === "light" ? "spark-cta-btn--light" : "spark-cta-btn--accent";
  const shellClass = variant === "light" ? "spark-cta-shell--light" : "spark-cta-shell--accent";
  const externalAttrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
  const classes = ["btn", "spark-cta-btn", variantClass, extraClass].filter(Boolean).join(" ");

  return `<div class="spark-cta-shell ${shellClass}">
    ${buildSparkCtaSparks()}
    <a href="${escapeAttr(href)}" class="${classes}"${externalAttrs}>${escapeHtml(label)}</a>
  </div>`;
}

window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;
window.safeCssColor = safeCssColor;
window.showSiteError = showSiteError;
window.queryEl = queryEl;
window.queryRequired = queryRequired;
window.buildSparkCtaButton = buildSparkCtaButton;

const LOTTIE_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
let lottieLoadPromise = null;

function loadLottieWeb() {
  if (window.lottie) return Promise.resolve(window.lottie);
  if (lottieLoadPromise) return lottieLoadPromise;

  lottieLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LOTTIE_CDN;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    script.async = true;
    script.onload = () => {
      if (window.lottie) resolve(window.lottie);
      else reject(new Error("lottie-web loaded without a global"));
    };
    script.onerror = () => reject(new Error("lottie-web failed to load"));
    document.head.appendChild(script);
  });

  return lottieLoadPromise;
}

function runWhenIdle(callback, timeoutMs = 2000) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: timeoutMs });
    return;
  }
  window.setTimeout(callback, 1);
}

window.loadLottieWeb = loadLottieWeb;
window.runWhenIdle = runWhenIdle;
