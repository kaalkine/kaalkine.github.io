let portfolioData = null;
let allItems = [];
let activeNiche = "";

async function loadPortfolioData() {
  const res = await fetch("data/portfolio.json");
  if (!res.ok) throw new Error("Failed to load portfolio data");
  return res.json();
}

function expandItems(items, target = 60) {
  const out = [...items];
  let n = 0;
  while (out.length < target) {
    const base = items[n % items.length];
    out.push({
      ...base,
      id: `${base.id}-dup-${out.length}`,
      variants: base.variants ? [...base.variants] : [{ label: "A", image: base.image }],
    });
    n++;
  }
  return out;
}

function sortItems(items) {
  return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function filterItems(items) {
  if (!activeNiche) return items;
  return items.filter((item) => item.niche === activeNiche);
}

function renderNicheFilter(niches) {
  const mount = document.getElementById("portfolio-sort");
  if (!mount || !niches?.length) return;

  mount.innerHTML = `
    <div class="portfolio-sort-row">
      <div class="portfolio-sort-select">
        <select id="portfolio-niche" class="portfolio-sort-native" aria-label="Sort by niche">
          <option value="">All</option>
          ${niches.map((n) => `<option value="${escapeAttr(n)}">${escapeHtml(n)}</option>`).join("")}
        </select>
        <button type="button" class="btn btn-primary portfolio-sort-trigger" aria-haspopup="listbox" aria-expanded="false">
          <span class="portfolio-sort-value">Sort by:</span>
          <span class="portfolio-sort-chevron" aria-hidden="true"></span>
        </button>
        <ul class="portfolio-sort-menu" role="listbox" hidden></ul>
      </div>
      <button type="button" class="portfolio-sort-clear" aria-label="Clear filter" hidden>&times;</button>
    </div>`;

  const row = mount.querySelector(".portfolio-sort-row");
  const select = mount.querySelector("#portfolio-niche");
  const trigger = mount.querySelector(".portfolio-sort-trigger");
  const valueEl = mount.querySelector(".portfolio-sort-value");
  const clearBtn = mount.querySelector(".portfolio-sort-clear");
  const menu = mount.querySelector(".portfolio-sort-menu");

  function closeMenu() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function syncTrigger() {
    const nicheLabel = select.value
      ? select.options[select.selectedIndex]?.textContent || ""
      : "";
    valueEl.textContent = nicheLabel ? `Sort by: ${nicheLabel}` : "Sort by:";
    if (clearBtn) clearBtn.hidden = !select.value;
    menu.querySelectorAll(".portfolio-sort-option").forEach((el) => {
      const selected = el.dataset.value === select.value;
      el.classList.toggle("is-selected", selected);
      el.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function setNiche(value) {
    activeNiche = value;
    select.value = value;
    syncTrigger();
    renderGrid();
  }

  function buildMenu() {
    menu.innerHTML = niches
      .map(
        (n) =>
          `<li class="portfolio-sort-option" role="option" data-value="${escapeAttr(n)}" tabindex="0">${escapeHtml(n)}</li>`
      )
      .join("");

    menu.querySelectorAll(".portfolio-sort-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        setNiche(opt.dataset.value);
        closeMenu();
      });
    });
    syncTrigger();
  }

  trigger.addEventListener("click", () => {
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (!row.contains(e.target)) closeMenu();
  });

  select.addEventListener("change", () => {
    setNiche(select.value);
  });

  clearBtn?.addEventListener("click", () => {
    setNiche("");
    closeMenu();
  });

  buildMenu();
}

function clientAvatarHue(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function renderGrid() {
  const grid = document.querySelector(".portfolio-grid");
  if (!grid) return;
  const items = sortItems(filterItems(allItems));

  grid.innerHTML = items
    .map((item) => {
      const variants = item.variants || [{ label: "A" }];
      const hasVariants = variants.length > 1;
      const showChannel = item.showChannel !== false;
      const client = showChannel ? item.client || "" : "";
      const initial = client ? escapeHtml(client.charAt(0).toUpperCase()) : "?";
      const hue = clientAvatarHue(client || item.title || "");
      const avatarHtml = showChannel
        ? item.channelIcon
          ? `<img class="portfolio-card-avatar portfolio-card-avatar--photo" src="${escapeAttr(item.channelIcon)}" alt="" width="28" height="28" loading="lazy">`
          : `<span class="portfolio-card-avatar" style="--avatar-hue: ${hue}" aria-hidden="true">${initial}</span>`
        : "";
      const meta = [];
      if (item.views) {
        meta.push(`<span class="portfolio-views-tag">${escapeHtml(item.views)}</span>`);
      }
      if (hasVariants) {
        meta.push(
          `<span class="portfolio-variant-tags">${variants
            .map((v) => `<span class="portfolio-variant-tag">${escapeHtml(v.label)}</span>`)
            .join("")}</span>`
        );
      }

      const label = escapeAttr(item.title);
      return `
    <article class="portfolio-card" data-id="${escapeAttr(item.id)}" tabindex="0" role="button" aria-label="View ${label}">
      <div class="portfolio-card-image">
        ${Manimate.renderVisual(item, { lazy: false })}
      </div>
      <div class="portfolio-card-body">
        <div class="portfolio-card-title-row">
          ${avatarHtml}
          <h3 class="portfolio-card-title">${escapeHtml(item.title)}</h3>
        </div>
        ${client ? `<p class="portfolio-card-client">${escapeHtml(client)}</p>` : ""}
        ${meta.length ? `<div class="portfolio-card-meta">${meta.join("")}</div>` : ""}
      </div>
    </article>`;
    })
    .join("");
}

window.initPortfolio = async function (site) {
  document.title = `${site.brand.name} | Portfolio`;

  const headline = document.querySelector(".portfolio-hero h1");
  const lead = document.querySelector(".portfolio-hero-lead");
  if (headline) headline.textContent = site.portfolio.headline;
  if (lead) lead.textContent = site.portfolio.subtitle;

  const heroCta = document.querySelector(".portfolio-hero-cta");
  if (heroCta && site.portfolio.cta) {
    heroCta.innerHTML = buildSparkCtaButton(site.portfolio.cta.href, site.portfolio.cta.label, {
      variant: "accent",
    });
  }

  const talkBtn = document.querySelector(".portfolio-talk-btn");
  if (talkBtn) {
    talkBtn.textContent = site.portfolio.cta.label;
    talkBtn.href = site.portfolio.cta.href;
  }

  const footerCta = site.footerCta;
  const footerH2 = document.querySelector(".footer-cta h2");
  const footerBtn = document.querySelector(".footer-cta .btn");
  if (footerH2) footerH2.textContent = footerCta.headline;
  if (footerBtn) {
    const label = footerBtn.querySelector(".btn-label");
    if (label) label.textContent = footerCta.subheadline;
    else footerBtn.textContent = footerCta.subheadline;
    footerBtn.href = footerCta.href;
  }

  portfolioData = await loadPortfolioData();
  allItems = expandItems(portfolioData.items, 60);
  Lightbox.setItems(allItems);
  Lightbox.init();
  Lightbox.bindGrid(document.querySelector(".portfolio-grid"));

  renderNicheFilter(portfolioData.niches);
  renderGrid();
};
