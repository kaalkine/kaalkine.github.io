/**
 * Shared thumbnail lightbox for portfolio grid and homepage wall.
 */
const Lightbox = {
  items: [],
  trigger: null,
  bound: false,

  setItems(items) {
    this.items = items || [];
  },

  findItem(id) {
    const direct = this.items.find((i) => i.id === id);
    if (direct) return direct;
    const baseId = id.replace(/-dup-\d+$/, "");
    return this.items.find((i) => i.id === baseId);
  },

  getFocusables() {
    const lightbox = document.querySelector(".lightbox");
    if (!lightbox) return [];
    return [...lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter((el) => !el.disabled && el.offsetParent !== null);
  },

  trapFocus(e) {
    if (e.key !== "Tab") return;
    const focusables = this.getFocusables();
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  },

  setPageAriaHidden(hidden) {
    document.querySelector("header")?.setAttribute("aria-hidden", hidden ? "true" : "false");
    document.querySelector("main")?.setAttribute("aria-hidden", hidden ? "true" : "false");
    document.querySelector(".site-footer")?.setAttribute("aria-hidden", hidden ? "true" : "false");
  },

  open(id, triggerEl) {
    const item = this.findItem(id);
    if (!item) return;

    const lightbox = document.querySelector(".lightbox");
    if (!lightbox) return;

    const closeBtn = document.querySelector(".lightbox-close");
    const variants = item.variants || [{ label: "A", image: item.image }];
    let activeVariant = 0;
    const imageWrap = document.querySelector(".lightbox-image-wrap");
    const tabs = document.querySelector(".lightbox-variants");

    this.trigger = triggerEl || document.activeElement;

    const renderVariant = () => {
      const variant = variants[activeVariant] || variants[0];
      const visualItem = {
        ...item,
        image: variant.image ?? item.image,
      };
      imageWrap.innerHTML = Manimate.renderVisual(visualItem, { lazy: false });

      if (variants.length > 1) {
        tabs.style.display = "flex";
        tabs.innerHTML = variants
          .map(
            (v, i) =>
              `<button class="variant-tab${i === activeVariant ? " active" : ""}" data-index="${i}" type="button">${escapeHtml(v.label)}</button>`
          )
          .join("");

        tabs.onclick = (e) => {
          const tab = e.target.closest(".variant-tab");
          if (!tab) return;
          activeVariant = parseInt(tab.dataset.index, 10);
          renderVariant();
        };
      } else {
        tabs.style.display = "none";
        tabs.innerHTML = "";
        tabs.onclick = null;
      }
    };

    document.querySelector(".lightbox-info h2").textContent = item.title;
    const showChannel = item.showChannel !== false;
    const metaParts = [];
    if (showChannel && item.client) metaParts.push(`<span>${escapeHtml(item.client)}</span>`);
    if (item.views) metaParts.push(`<span class="views">${escapeHtml(item.views)}</span>`);
    if (item.niche) metaParts.push(`<span>${escapeHtml(item.niche)}</span>`);
    document.querySelector(".lightbox-meta").innerHTML = metaParts.join("");

    renderVariant();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    this.setPageAriaHidden(true);
    closeBtn?.focus();
  },

  close() {
    const lightbox = document.querySelector(".lightbox");
    lightbox?.classList.remove("open");
    lightbox?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    this.setPageAriaHidden(false);

    if (this.trigger && typeof this.trigger.focus === "function") {
      this.trigger.focus();
    }
    this.trigger = null;
  },

  init() {
    if (this.bound) return;
    this.bound = true;

    document.querySelector(".lightbox-close")?.addEventListener("click", () => this.close());
    document.querySelector(".lightbox")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("lightbox")) this.close();
    });
    document.addEventListener("keydown", (e) => {
      const lightbox = document.querySelector(".lightbox");
      if (!lightbox?.classList.contains("open")) return;
      if (e.key === "Escape") this.close();
      else this.trapFocus(e);
    });
  },

  bindGrid(container) {
    if (!container || container.dataset.lightboxBound) return;
    container.dataset.lightboxBound = "true";

    container.addEventListener("click", (e) => {
      const card = e.target.closest(".portfolio-card[data-id], .thumb-cell[data-id], .why-cell--image[data-id]");
      if (!card) return;
      this.open(card.dataset.id, card);
    });

    container.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".portfolio-card[data-id], .thumb-cell[data-id], .why-cell--image[data-id]");
      if (!card) return;
      e.preventDefault();
      this.open(card.dataset.id, card);
    });
  },
};

window.Lightbox = Lightbox;
