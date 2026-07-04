let portfolioData = null;

let allItems = [];



async function loadPortfolioData() {

  const res = await fetch("data/portfolio.json");

  if (!res.ok) throw new Error("Failed to load portfolio data");

  return res.json();

}



function renderGrid() {
  const grid = document.querySelector(".portfolio-grid");
  if (!grid) return;

  // Preserve portfolio.json order (matches portfolioPage folder: 1…7, 8 (2), 8…15, then named).
  const items = allItems;



  grid.innerHTML = items

    .map(

      (item, i) => `

    <article class="portfolio-card" data-id="${escapeAttr(item.id)}" tabindex="0" role="button" aria-label="View thumbnail">

      <div class="portfolio-card-image">

        ${Manimate.renderVisual(item, {
          width: 1920,
          height: 1080,
          responsive: true,
          // First row is above the fold; skip lazy-loading so it paints immediately.
          lazy: i >= 4,
          priority: i < 4,
        })}

      </div>

    </article>`

    )

    .join("");



  grid.querySelectorAll(".portfolio-card-image picture").forEach((picture) => {

    const img = picture.querySelector("img");

    if (!img) return;

    if (img.complete) picture.classList.add("loaded");

    else {

      img.addEventListener("load", () => picture.classList.add("loaded"), { once: true });

      img.addEventListener("error", () => picture.classList.add("loaded"), { once: true });

    }

  });

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

  allItems = portfolioData.items;

  Lightbox.setItems(allItems);

  Lightbox.init();

  Lightbox.bindGrid(document.querySelector(".portfolio-grid"));



  renderGrid();

};

