const SITE_DATA_URL = "data/site.json";

async function loadSiteData() {
  const res = await fetch(SITE_DATA_URL);
  if (!res.ok) throw new Error("Failed to load site data");
  return res.json();
}

async function loadPortfolioData() {
  const res = await fetch("data/portfolio.json");
  if (!res.ok) throw new Error("Failed to load portfolio data");
  return res.json();
}

function normalizePageName(path) {
  const name = path || "";
  if (!name || name === "index" || name === "index.html") return "index.html";
  if (!name.includes(".")) return `${name}.html`;
  return name;
}

function getCurrentPage() {
  const path = window.location.pathname.split("/").pop() || "";
  return normalizePageName(path);
}

function brandLogoUrl(brand) {
  const path = brand?.logo || "assets/brand/kaalkine-logo.svg";
  const version = brand?.logoVersion || "1";
  return `${path}?v=${encodeURIComponent(version)}`;
}

function applyBrandAssets(site) {
  const logoUrl = brandLogoUrl(site.brand);
  document.querySelectorAll(".logo-mark").forEach((img) => {
    img.src = logoUrl;
  });
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.href = logoUrl;
}

function renderNav(site, activePage) {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;
  const current = normalizePageName(activePage);

  navLinks.innerHTML = site.nav
    .map((item) => {
      const isActive = normalizePageName(item.href) === current;
      const classes = [isActive ? "active" : "", item.cta ? "nav-cta" : ""].filter(Boolean).join(" ");
      return `<a href="${escapeAttr(item.href)}" class="${classes}">${escapeHtml(item.label)}</a>`;
    })
    .join("");
}

function renderSocials(site, container) {
  if (!container) return;
  const links = (site.socials || []).filter((s) => s.footer !== false);
  container.innerHTML = links
    .map(
      (s) => `
    <a href="${escapeAttr(s.href)}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttr(s.label)}">
      ${socialIcon(s.icon)}
    </a>`
    )
    .join("");
}

function socialIcon(name) {
  const icons = {
    x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
    discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  };
  return icons[name] || "";
}

function processIcon(name) {
  const icons = {
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`,
    wand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12 4l-1.5 3M6 12l-3 1.5M12 20l1.5-3M6 12l3-1.5"/><path d="M12 12l9-9"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  };
  return icons[name] || icons.send;
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });
}

function initFAQ(container) {
  if (!container) return;
  container.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-question");
    if (!btn || btn.dataset.faqBound) return;
    btn.dataset.faqBound = "true";
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      container.querySelectorAll(".faq-item").forEach((i) => {
        i.classList.remove("open");
        i.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function renderFAQ(faqList, container) {
  if (!container) return;
  container.innerHTML = faqList
    .map(
      (item) => `
    <div class="faq-item reveal-fade">
      <button class="faq-question" type="button" aria-expanded="false">
        <span class="faq-plus" aria-hidden="true">+</span>
        <span class="faq-question-text">${escapeHtml(item.question)}</span>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${escapeHtml(item.answer)}</div>
      </div>
    </div>`
    )
    .join("");
  container.setAttribute("data-reveal-stagger", "");
  initFAQ(container);
}

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function applyTrustedSubscriberRoles(testimonials, trustedBy) {
  const subsByHref = Object.fromEntries(
    (trustedBy?.creators || []).map((c) => [c.href, c.subscribers])
  );
  return testimonials.map((t) => {
    const subs = subsByHref[t.href];
    if (!subs) return t;
    return { ...t, role: `youtuber (${subs})` };
  });
}

function renderTestimonialAvatar(t) {
  if (t.image) {
    return `<img class="testimonial-avatar testimonial-avatar--photo" src="${escapeAttr(t.image)}" alt="" width="40" height="40" loading="lazy">`;
  }
  return `<div class="testimonial-avatar" aria-hidden="true">${escapeHtml(getInitials(t.name))}</div>`;
}

function renderTestimonialSlide(t) {
  const authorInner = `
          <div class="testimonial-author">${escapeHtml(t.name)}</div>
          <div class="testimonial-role">${escapeHtml(t.role)}</div>`;
  const authorBlock = t.href
    ? `<a class="testimonial-author-link" href="${escapeAttr(t.href)}" target="_blank" rel="noopener noreferrer">${authorInner}</a>`
    : `<div>${authorInner}</div>`;

  return `
    <article class="testimonial-carousel-slide">
      <blockquote>${escapeHtml(t.quote)}</blockquote>
      <div class="testimonial-tile-footer">
        ${renderTestimonialAvatar(t)}
        ${authorBlock}
      </div>
    </article>`;
}

function initTestimonialCarousel(carousel, testimonials) {
  const track = carousel.querySelector(".testimonial-carousel-track");
  const viewport = carousel.querySelector(".testimonial-carousel-viewport");
  if (!track || !viewport || !testimonials.length) return;

  const count = testimonials.length;
  const slideHtml = testimonials.map((t) => renderTestimonialSlide(t)).join("");
  track.innerHTML = slideHtml + slideHtml;

  let offset = 0;
  let slideWidth = 0;
  let setWidth = 0;
  let isDragging = false;
  let didDrag = false;
  let startX = 0;
  let dragStartOffset = 0;
  let autoTimer = null;
  let resumeTimer = null;
  const SLIDE_MS = 5000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function measure() {
    const slide = track.children[0];
    if (!slide) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    slideWidth = slide.getBoundingClientRect().width + gap;
    setWidth = count * slideWidth;
    wrapOffset();
  }

  function wrapOffset() {
    if (setWidth <= 0) return;
    if (offset >= setWidth) offset -= setWidth;
    if (offset < 0) offset += setWidth;
  }

  function renderPosition(animate = false) {
    track.style.transition =
      animate && !reducedMotion ? "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)" : "none";
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  }

  function step(dir = 1) {
    if (slideWidth <= 0) return;
    offset += dir * slideWidth;
    wrapOffset();
    renderPosition(true);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function startAuto() {
    stopAuto();
    if (count <= 1) return;
    autoTimer = setInterval(() => step(1), SLIDE_MS);
  }

  function scheduleAutoResume(delay = SLIDE_MS) {
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAuto, delay);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    isDragging = true;
    didDrag = false;
    startX = e.clientX;
    dragStartOffset = offset;
    stopAuto();
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
    viewport.classList.add("is-dragging");
    track.style.transition = "none";
    viewport.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const delta = startX - e.clientX;
    if (Math.abs(delta) > 6) didDrag = true;
    offset = dragStartOffset + delta;
    if (setWidth > 0) {
      offset = ((offset % setWidth) + setWidth) % setWidth;
    }
    renderPosition(false);
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove("is-dragging");
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    if (slideWidth > 0) {
      const draggedSlides = (offset - dragStartOffset) / slideWidth;
      const base =
        Math.abs(draggedSlides) >= 0.12
          ? dragStartOffset + Math.round(draggedSlides) * slideWidth
          : offset;
      offset = Math.round(base / slideWidth) * slideWidth;
      wrapOffset();
      renderPosition(true);
    }

    scheduleAutoResume(SLIDE_MS * 1.5);
  }

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", onPointerUp);
  viewport.addEventListener("pointercancel", onPointerUp);

  viewport.addEventListener(
    "click",
    (e) => {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  const ro = new ResizeObserver(() => {
    measure();
    renderPosition(false);
  });
  ro.observe(viewport);

  measure();
  renderPosition(false);
  startAuto();

  carousel._carouselCleanup = () => {
    stopAuto();
    if (resumeTimer) clearTimeout(resumeTimer);
  };
}

function renderTestimonialCarousel(testimonials) {
  const carousel = document.querySelector(".testimonial-carousel");
  if (!carousel || !testimonials.length) return;
  initTestimonialCarousel(carousel, testimonials);
}

function renderHeroVisual() {
  const frame = document.querySelector(".hero-visual-frame");
  if (!frame) return;
  frame.innerHTML = Manimate.renderHeroScene();
  if (typeof scheduleHeroLottie === "function") scheduleHeroLottie();
  else if (typeof initHeroLottie === "function") initHeroLottie();
}

function renderHeroTrusted(trusted) {
  const row = document.querySelector(".hero-trusted-row");
  if (!row || !trusted) return;

  const creators = trusted.creators || [];
  row.innerHTML = creators
    .map(
      (creator) => `
    <a class="trusted-creator" href="${escapeAttr(creator.href)}" target="_blank" rel="noopener noreferrer"
      aria-label="${escapeAttr(`${creator.name}, youtuber (${creator.subscribers})`)}">
      <img class="trusted-creator-photo" src="${escapeAttr(creator.image)}" alt="${escapeAttr(creator.name)}" width="56" height="56" loading="lazy">
      <span class="trusted-creator-tooltip" role="tooltip">
        <span class="trusted-creator-channel">${escapeHtml(creator.name)}</span>
        <span class="trusted-creator-subs">youtuber (${escapeHtml(creator.subscribers)})</span>
      </span>
    </a>`
    )
    .join("");
}

function thumbCell(t, edge = "") {
  if (!t) {
    return `<div class="thumb-cell thumb-cell--empty reveal-up" aria-hidden="true"></div>`;
  }
  const edgeClass =
    edge === "left" ? " thumb-cell--edge-left" : edge === "right" ? " thumb-cell--edge-right" : "";
  const visual = Manimate.renderVisual(t, { width: 1920, height: 1080 });
  const label = escapeAttr(t.title);
  return `<button type="button" class="thumb-cell reveal-up${edgeClass}" data-id="${escapeAttr(t.id)}" aria-label="View ${label}"><span class="thumb-cell-media">${visual}</span></button>`;
}

function textCell(vp) {
  return `<div class="thumb-cell thumb-cell--text reveal-up"><h3>${escapeHtml(vp.title)}</h3><p>${escapeHtml(vp.body)}</p></div>`;
}

function getHomepageItems(items) {
  const bySlot = new Map();
  items.forEach((item) => {
    const slot = item.homepageSlot;
    if (slot >= 1 && slot <= 10) bySlot.set(slot, item);
  });

  if (bySlot.size > 0) {
    const result = [];
    for (let s = 1; s <= 10; s++) {
      if (bySlot.has(s)) result.push(bySlot.get(s));
    }
    if (result.length >= 10) return result;

    const used = new Set(result.map((i) => i.id));
    for (const item of items) {
      if (result.length >= 10) break;
      if (!used.has(item.id) && !item.homepageSlot) {
        result.push(item);
        used.add(item.id);
      }
    }
    return result.length ? result : items.slice(0, 10);
  }

  return items.slice(0, 10);
}

function renderThumbnailWall(portfolio, site) {
  const grid = document.querySelector(".thumb-wall-grid");
  if (!grid) return;

  const thumbs = getHomepageItems(portfolio.items);
  const [vp0, vp1] = site.valueProps;

  // ike layout — 6×2 grid: row1 = 2 thumbs | text | 3 thumbs, row2 = 3 | text | 2
  const ordered = [];
  ordered.push(thumbCell(thumbs[0], "left"));
  if (thumbs[1]) ordered.push(thumbCell(thumbs[1]));
  if (vp0) ordered.push(textCell(vp0));
  thumbs.slice(2, 4).forEach((t) => ordered.push(thumbCell(t)));
  if (thumbs[4]) ordered.push(thumbCell(thumbs[4], "right"));
  ordered.push(thumbCell(thumbs[5], "left"));
  thumbs.slice(6, 8).forEach((t) => ordered.push(thumbCell(t)));
  if (vp1) ordered.push(textCell(vp1));
  if (thumbs[8]) ordered.push(thumbCell(thumbs[8]));
  if (thumbs[9]) ordered.push(thumbCell(thumbs[9], "right"));

  grid.setAttribute("data-reveal-stagger", "");
  grid.innerHTML = ordered.join("");

  Lightbox.setItems(portfolio.items);
  Lightbox.init();
  Lightbox.bindGrid(grid);
}

function resolveWhyHireItem(pillar, portfolioItems, index) {
  if (pillar?.image) {
    return { image: pillar.image, title: pillar.title || "" };
  }
  if (pillar?.portfolioItemId) {
    const found = portfolioItems.find((item) => item.id === pillar.portfolioItemId);
    if (found) return found;
  }
  const idx = pillar?.imageIndex ?? index;
  return portfolioItems[idx] || portfolioItems[0];
}

function renderWhyHireGrid(pillars, portfolioItems) {
  const grid = document.querySelector(".why-hire-grid");
  if (!grid) return;

  const itemFor = (p, i) => resolveWhyHireItem(p, portfolioItems, i);

  const textCell = (p) =>
    `<div class="why-cell why-cell--text reveal-up"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`;
  const imageCell = (item) => {
    if (!item?.image && !item?.id) {
      return `<div class="why-cell why-cell--image why-cell--empty reveal-scale" aria-hidden="true"></div>`;
    }
    const label = escapeAttr(item.title || "thumbnail");
    return `<button type="button" class="why-cell why-cell--image reveal-scale" data-id="${escapeAttr(item.id || "")}" aria-label="View ${label}"><div class="why-cell-media">${Manimate.renderVisual(item)}</div></button>`;
  };

  // ike layout: row1 = text | image | text, row2 = image | text | image
  const [p0, p1, p2] = pillars;
  const ordered = [];

  if (p0) {
    ordered.push(textCell(p0), imageCell(itemFor(p0, 0)));
  }
  if (p1) {
    ordered.push(textCell(p1));
  }
  if (p1 && p2) {
    ordered.push(imageCell(itemFor(p1, 1)), textCell(p2), imageCell(itemFor(p2, 2)));
  } else if (p2) {
    ordered.push(imageCell(itemFor(p2, 2)), textCell(p2));
  }

  grid.setAttribute("data-reveal-stagger", "");
  grid.innerHTML = ordered.join("");
  Lightbox.bindGrid(grid);
}


async function renderHome(site) {
  document.title = `${site.brand.name} | ${site.brand.tagline}`;

  const hero = site.hero;
  queryRequired(".hero h1").textContent = hero.headline;
  queryRequired(".hero-lead").textContent = hero.subheadline;
  queryRequired(".hero-actions").innerHTML = `
    <a href="${escapeAttr(hero.ctaPrimary.href)}" class="btn btn-primary">${escapeHtml(hero.ctaPrimary.label)}</a>
    <a href="${escapeAttr(hero.ctaSecondary.href)}" class="btn btn-ghost">${escapeHtml(hero.ctaSecondary.label)}</a>`;

  const portfolioPromise = loadPortfolioData();

  renderHeroTrusted(site.trustedBy);
  renderHeroVisual();
  renderTestimonialCarousel(applyTrustedSubscriberRoles(site.testimonials, site.trustedBy));

  const portfolio = await portfolioPromise;
  renderThumbnailWall(portfolio, site);

  const process = site.process;
  queryRequired(".process .section-title").textContent = process.title;
  queryRequired(".process .section-subtitle").textContent = process.subtitle;
  const processSteps = queryRequired(".process-steps");
  processSteps.setAttribute("data-reveal-stagger", "");
  processSteps.innerHTML = process.steps
    .map(
      (step, i) => `
    <div class="process-step reveal-up">
      <div class="process-step-icon">${processIcon(step.icon)}</div>
      <div class="process-step-label">${i + 1}. ${escapeHtml(step.title)}</div>
      <p>${escapeHtml(step.body)}</p>
    </div>`
    )
    .join("");
  queryRequired(".process-cta").innerHTML = `<a href="${escapeAttr(process.cta.href)}" class="btn btn-dark reveal-fade">${escapeHtml(process.cta.label)}</a>`;

  queryRequired(".why-hire .section-title").textContent = site.whyHire.title;
  renderWhyHireGrid(site.whyHire.pillars, portfolio.items);

  renderFAQ(site.faq, queryRequired(".faq-list"));

  const footerCta = site.footerCta;
  queryRequired(".footer-cta h2").textContent = footerCta.headline;
  const footerBtn = queryRequired(".footer-cta .btn");
  const footerBtnLabel = footerBtn.querySelector(".btn-label");
  if (footerBtnLabel) footerBtnLabel.textContent = footerCta.subheadline;
  else footerBtn.textContent = footerCta.subheadline;
  footerBtn.href = footerCta.href;
  queryRequired(".footer-copy").textContent = `© ${site.brand.copyright}`;

  revealHero();
  initScrollReveals();
}

function formatStoryBody(body) {
  const paragraphs = Array.isArray(body) ? body : [body];
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

function renderStory(site) {
  document.title = `${site.brand.name} | My Story`;
  const story = site.story;

  const heroVisual = document.querySelector(".story-hero-visual");
  if (heroVisual) {
    heroVisual.innerHTML = Manimate.renderStoryIllustration("portrait");
  }

  const heroTitle = document.querySelector(".story-hero h1");
  const heroBody = document.querySelector(".story-hero-body");
  if (heroTitle) heroTitle.textContent = story.hero.headline;
  if (heroBody) heroBody.innerHTML = formatStoryBody(story.hero.body);

  const blocksEl = document.querySelector(".story-blocks");
  if (blocksEl) {
    blocksEl.innerHTML = story.blocks
      .map((block, i) => {
        const reverse = block.layout === "text-right";
        const textCol = `
        <div class="story-block-text reveal">
          <h2>${escapeHtml(block.headline)}</h2>
          ${formatStoryBody(block.body)}
        </div>`;
        const visualCol = `
        <div class="story-block-visual reveal reveal-delay-1" aria-hidden="true">
          ${Manimate.renderStoryIllustration(block.illustration, block.id)}
        </div>`;

        return `
      <section class="story-block-row${reverse ? " story-block-row--reverse" : ""}">
        <div class="container story-block-inner">
          ${textCol}
          ${visualCol}
        </div>
      </section>`;
      })
      .join("");
  }

  const footerCta = site.footerCta;
  const footerSection = document.querySelector(".footer-cta");
  if (footerSection) {
    const h2 = footerSection.querySelector("h2");
    const btn = footerSection.querySelector(".btn");
    if (h2) h2.textContent = footerCta.headline;
    if (btn) {
      const label = btn.querySelector(".btn-label");
      if (label) label.textContent = footerCta.subheadline;
      else btn.textContent = footerCta.subheadline;
      btn.href = footerCta.href;
    }
  }
  const footerCopy = document.querySelector(".site-footer .footer-copy");
  if (footerCopy) footerCopy.textContent = `© ${site.brand.copyright}`;
}

function renderContactPage(site) {
  document.title = `${site.brand.name} | Contact`;

  const heroTitle = document.querySelector(".contact-hero h1");
  const heroLead = document.querySelector(".contact-hero-lead");
  if (heroTitle) heroTitle.textContent = site.contact.headline;
  if (heroLead) heroLead.textContent = site.contact.subtitle;

  renderFAQ(site.faq, document.querySelector(".contact-faq .faq-list"));

  const discordNoteEl = document.querySelector(".contact-discord-note");
  const discordText = document.querySelector(".contact-discord-text");
  const discordHandle = document.querySelector(".contact-discord-handle");
  const discordSocial = site.socials?.find((s) => s.icon === "discord");
  if (discordText && site.contact.discordNote) {
    discordText.textContent = site.contact.discordNote;
  }
  if (discordHandle && discordSocial && site.contact.discordHandle) {
    discordHandle.innerHTML = buildSparkCtaButton(discordSocial.href, site.contact.discordHandle, {
      variant: "light",
      external: true,
    });
  } else if (discordNoteEl) {
    discordNoteEl.hidden = true;
  }

  const platformSelect = document.getElementById("platform");
  if (platformSelect && site.contact.platforms) {
    const options = site.contact.platforms
      .map((p) => `<option value="${escapeAttr(p)}">${escapeHtml(p)}</option>`)
      .join("");
    platformSelect.insertAdjacentHTML("beforeend", options);
  }

  const footnotesEl = document.querySelector(".contact-footnotes");
  if (footnotesEl && site.contact.pricing?.footnotes) {
    footnotesEl.innerHTML = site.contact.pricing.footnotes
      .map((note) => `<p>${escapeHtml(note)}</p>`)
      .join("");
  }

  const footerCopy = document.querySelector(".contact-footer-copy");
  if (footerCopy) footerCopy.textContent = `© ${site.brand.copyright}`;

  renderSocials(site, document.querySelector(".contact-footer-socials"));
}

async function init() {
  try {
    const site = await loadSiteData();
    const page = getCurrentPage();

    const logo = document.querySelector(".logo");
    const logoText = logo?.querySelector(".logo-text");
    if (logoText) logoText.textContent = site.brand.name;
    else if (logo) logo.textContent = site.brand.name;
    applyBrandAssets(site);
    renderNav(site, page);
    renderSocials(site, document.querySelector(".site-footer .social-links"));

    if (page === "index.html" || page === "") {
      await renderHome(site);
    } else if (page === "story.html") {
      renderStory(site);
      if (window.scheduleStoryLottie) window.scheduleStoryLottie();
      else if (window.initStoryLottie) window.initStoryLottie();
      revealHero();
      initScrollReveals();
    } else if (page === "contact.html") {
      renderContactPage(site);
      if (window.initContactForm) window.initContactForm(site);
      revealHero();
      initScrollReveals();
    } else if (page === "portfolio.html") {
      document.querySelector(".footer-copy").textContent = `© ${site.brand.copyright}`;
      if (window.initPortfolio) await window.initPortfolio(site);
      revealHero();
      initScrollReveals();
    }

    initMobileNav();
  } catch (err) {
    console.error(err);
    showSiteError(
      "This page could not load its content. If you opened the file directly, use a local server instead. Otherwise refresh or try again later."
    );
  }
}

document.addEventListener("DOMContentLoaded", init);
