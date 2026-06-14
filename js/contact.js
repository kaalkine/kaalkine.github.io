const FORMSPREE_ENDPOINT = "https://formspree.io/f/xlgkwzdn";

let updateContactQuote = null;
let contactFormBound = false;

function getFormspreeEndpoint(form, site) {
  const fromSite = site?.formspreeEndpoint;
  const fromForm = form?.getAttribute("action");
  const endpoint = fromSite || fromForm || FORMSPREE_ENDPOINT;
  if (form && endpoint) form.action = endpoint;
  return endpoint;
}

function initCustomSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select || select.dataset.customSelect === "true") return;

  const wrap = document.createElement("div");
  wrap.className = "form-select";
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add("form-select-native");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "form-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML =
    '<span class="form-select-value"></span><span class="form-select-chevron" aria-hidden="true"></span>';

  const menu = document.createElement("ul");
  menu.className = "form-select-menu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;

  wrap.appendChild(trigger);
  wrap.appendChild(menu);

  const valueEl = trigger.querySelector(".form-select-value");

  function closeMenu() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function syncTrigger() {
    const opt = select.options[select.selectedIndex];
    const placeholder = select.options[0]?.textContent || "Choose…";
    valueEl.textContent = select.value ? opt?.textContent || placeholder : placeholder;
    valueEl.classList.toggle("is-placeholder", !select.value);
    menu.querySelectorAll(".form-select-option").forEach((el) => {
      const selected = el.dataset.value === select.value;
      el.classList.toggle("is-selected", selected);
      el.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function buildMenu() {
    menu.innerHTML = "";
    [...select.options].forEach((opt) => {
      if (!opt.value) return;
      const li = document.createElement("li");
      li.className = "form-select-option";
      li.setAttribute("role", "option");
      li.dataset.value = opt.value;
      li.textContent = opt.textContent;
      li.tabIndex = 0;
      li.addEventListener("click", () => {
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        closeMenu();
        syncTrigger();
      });
      menu.appendChild(li);
    });
    syncTrigger();
  }

  trigger.addEventListener("click", () => {
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) closeMenu();
  });

  select.addEventListener("change", syncTrigger);
  select.form?.addEventListener("reset", () => {
    requestAnimationFrame(syncTrigger);
  });

  new MutationObserver(buildMenu).observe(select, { childList: true });
  select.dataset.customSelect = "true";
  buildMenu();
}

function initContactPricing(site) {
  const pricing = site.contact.pricing;
  const qtyInput = document.getElementById("thumbnails");
  const totalEl = document.getElementById("quote-total");
  const turnaroundEl = document.getElementById("quote-turnaround");
  if (!pricing || !qtyInput || !totalEl || !turnaroundEl) return;

  updateContactQuote = function updateQuote() {
    const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    const total = qty * pricing.perThumbnail;

    totalEl.textContent = `${pricing.symbol}${total}*`;
    const turnaround =
      pricing.turnaround[String(qty)] || pricing.turnaround.default;
    turnaroundEl.textContent = `${turnaround}**`;
  };

  if (!qtyInput.dataset.pricingBound) {
    qtyInput.dataset.pricingBound = "true";
    qtyInput.addEventListener("input", updateContactQuote);
  }
  updateContactQuote();
}

window.initContactForm = function (site) {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  getFormspreeEndpoint(form, site);
  initContactPricing(site);
  initCustomSelect("platform");

  if (contactFormBound) return;
  contactFormBound = true;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";
    status.style.display = "none";

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const formData = new FormData(form);
      const total = document.getElementById("quote-total")?.textContent || "";
      const turnaround = document.getElementById("quote-turnaround")?.textContent || "";
      formData.append("estimated_total", total);
      formData.append("estimated_turnaround", turnaround);
      formData.append("_subject", `New inquiry from ${formData.get("name") || "contact form"}`);

      const res = await fetch(getFormspreeEndpoint(form), {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        status.className = "form-status success";
        status.textContent = "Thanks! Your message has been sent. I'll get back to you soon.";
        status.style.display = "block";
        form.reset();
        const qtyField = document.getElementById("thumbnails");
        if (qtyField) qtyField.value = "1";
        updateContactQuote?.();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }
    } catch (err) {
      status.className = "form-status error";
      status.textContent =
        err.message === "Failed to fetch"
          ? "Could not send message. Check your Formspree endpoint in data/site.json."
          : err.message || "Failed to send. Please try again or email directly.";
      status.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
};
