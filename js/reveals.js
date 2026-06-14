const REVEAL_SELECTOR = ".reveal, .reveal-up, .reveal-fade, .reveal-scale";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

function applyStaggerIndices(root) {
  root.querySelectorAll("[data-reveal-stagger]").forEach((parent) => {
    const items = parent.querySelectorAll(REVEAL_SELECTOR);
    items.forEach((item, i) => {
      item.style.setProperty("--reveal-i", String(Math.min(i, 14)));
    });
  });
}

function initScrollReveals(root = document) {
  const elements = root.querySelectorAll(REVEAL_SELECTOR);
  if (!elements.length) return;

  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  document.documentElement.classList.add("js-reveals");
  applyStaggerIndices(root);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
  );

  elements.forEach((el) => {
    if (
      el.closest(".hero") ||
      el.closest(".portfolio-hero") ||
      el.closest(".story-hero") ||
      el.closest(".contact-hero") ||
      isInViewport(el)
    ) {
      el.classList.add("is-visible");
      return;
    }
    observer.observe(el);
  });
}

const HERO_REVEAL_SELECTOR =
  ".hero .reveal, .hero .reveal-up, .hero .reveal-fade, .hero .reveal-scale, " +
  ".portfolio-hero .reveal, .portfolio-hero .reveal-up, .portfolio-hero .reveal-fade, .portfolio-hero .reveal-scale, " +
  ".story-hero .reveal, .story-hero .reveal-up, .story-hero .reveal-fade, .story-hero .reveal-scale, " +
  ".contact-hero .reveal, .contact-hero .reveal-up, .contact-hero .reveal-fade, .contact-hero .reveal-scale";

function revealHero() {
  document.querySelectorAll(HERO_REVEAL_SELECTOR).forEach((el) => {
    el.classList.add("is-visible");
  });
}

window.initScrollReveals = initScrollReveals;
window.observeReveals = initScrollReveals;
window.revealHero = revealHero;
