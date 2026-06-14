/**
 * Admin panel — homepage thumbnail wall (10 slots) + Why Hire section images.
 */
const AdminHomepage = {
  pending: new Map(),

  clearPending() {
    this.pending.forEach((url) => {
      if (String(url).startsWith("blob:")) URL.revokeObjectURL(url);
    });
    this.pending.clear();
  },

  getSlotItem(portfolio, slot) {
    return portfolio.items.find((item) => item.homepageSlot === slot) || null;
  },

  assignSlot(portfolio, itemId, slot) {
    portfolio.items.forEach((item) => {
      if (item.homepageSlot === slot) delete item.homepageSlot;
    });
    const item = portfolio.items.find((i) => i.id === itemId);
    if (item) item.homepageSlot = slot;
  },

  previewUrl(key, fallbackPath) {
    if (this.pending.has(`blob:${key}`)) return this.pending.get(`blob:${key}`);
    return fallbackPath ? itemImageUrl(fallbackPath) : itemImageUrl("../assets/placeholder-thumb.svg");
  },

  portfolioOptions(portfolio, selectedId) {
    return portfolio.items
      .map(
        (item) =>
          `<option value="${escapeAttr(item.id)}"${item.id === selectedId ? " selected" : ""}>${escapeHtml(item.title || item.id)}</option>`
      )
      .join("");
  },

  stageWallFile(slot, file, portfolio) {
    const key = `wall:${slot}`;
    if (this.pending.has(`blob:${key}`)) URL.revokeObjectURL(this.pending.get(`blob:${key}`));
    this.pending.set(`blob:${key}`, URL.createObjectURL(file));
    this.pending.set(`file:${key}`, file);
    if (typeof markDirty === "function") markDirty();
    this.renderWallSlots(portfolio);
  },

  stageHeroFile(id, file) {
    const key = `hero:${id}`;
    if (this.pending.has(`blob:${key}`)) URL.revokeObjectURL(this.pending.get(`blob:${key}`));
    this.pending.set(`blob:${key}`, URL.createObjectURL(file));
    this.pending.set(`file:${key}`, file);
    if (typeof markDirty === "function") markDirty();
    this.renderHeroLottie();
  },

  stageWhyFile(index, file, site, portfolio) {
    const key = `why:${index}`;
    if (this.pending.has(`blob:${key}`)) URL.revokeObjectURL(this.pending.get(`blob:${key}`));
    this.pending.set(`blob:${key}`, URL.createObjectURL(file));
    this.pending.set(`file:${key}`, file);
    const pillar = site.whyHire.pillars[index];
    delete pillar.portfolioItemId;
    if (typeof markDirty === "function") markDirty();
    this.renderWhyHire(site, portfolio);
  },

  renderWallSlots(portfolio) {
    const mount = document.getElementById("admin-wall-slots");
    if (!mount) return;

    mount.innerHTML = Array.from({ length: 10 }, (_, i) => {
      const slot = i + 1;
      const item = this.getSlotItem(portfolio, slot);
      const preview = this.previewUrl(`wall:${slot}`, item?.image);
      return `
        <div class="admin-slot-card admin-dropzone" data-wall-slot="${slot}" tabindex="0">
          <div class="admin-slot-head">
            <strong>Slot ${slot}</strong>
            <span class="admin-slot-meta">${item ? escapeHtml(item.title || item.id) : "Unassigned"}</span>
          </div>
          <img class="admin-thumb-preview admin-slot-preview" src="${escapeAttr(preview)}" alt="">
          <label class="admin-field">
            <span class="admin-field-label">Portfolio item</span>
            <select class="admin-wall-item" data-wall-slot="${slot}">
              <option value="">— Select item —</option>
              ${this.portfolioOptions(portfolio, item?.id)}
            </select>
          </label>
          <div class="admin-upload-row">
            <input type="file" class="admin-wall-file" data-wall-slot="${slot}" accept="image/*" hidden>
            <button type="button" class="btn btn-ghost btn-sm admin-wall-pick" data-wall-slot="${slot}">Upload image</button>
            <span class="admin-drop-hint">paste, drop, or pick</span>
          </div>
        </div>`;
    }).join("");

    mount.querySelectorAll(".admin-wall-item").forEach((select) => {
      select.addEventListener("change", () => {
        const slot = parseInt(select.dataset.wallSlot, 10);
        if (!select.value) return;
        this.assignSlot(portfolio, select.value, slot);
        if (typeof markDirty === "function") markDirty();
        this.renderWallSlots(portfolio);
        renderHomepageGrid();
        renderItemList();
      });
    });

    mount.querySelectorAll(".admin-wall-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = btn.dataset.wallSlot;
        mount.querySelector(`.admin-wall-file[data-wall-slot="${slot}"]`)?.click();
      });
    });

    mount.querySelectorAll(".admin-wall-file").forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        this.stageWallFile(parseInt(input.dataset.wallSlot, 10), file, portfolio);
      });
    });

    mount.querySelectorAll(".admin-dropzone[data-wall-slot]").forEach((zone) => {
      AdminUpload.bindImageZone(zone, (file) =>
        this.stageWallFile(parseInt(zone.dataset.wallSlot, 10), file, portfolio)
      );
    });
  },

  heroLottieSlots() {
    const cfg = GitHubStore.config || {};
    return [
      {
        id: "portrait",
        label: "Portrait (body)",
        path: cfg.heroPortraitPath || "me_plus_hand/justGUY.png",
      },
      {
        id: "hand",
        label: "Hand + stylus",
        path: cfg.heroHandPath || "me_plus_hand/justHAND.png",
      },
    ];
  },

  renderHeroLottie() {
    const mount = document.getElementById("admin-hero-lottie");
    if (!mount) return;

    mount.innerHTML = this.heroLottieSlots()
      .map((slot) => {
        const preview = this.previewUrl(`hero:${slot.id}`, itemImageUrl(slot.path));
        return `
      <div class="admin-slot-card admin-slot-card--wide admin-dropzone" data-hero-id="${escapeAttr(slot.id)}" tabindex="0">
        <div class="admin-slot-head">
          <strong>${escapeHtml(slot.label)}</strong>
          <span class="admin-slot-meta">${escapeHtml(slot.path)}</span>
        </div>
        <img class="admin-thumb-preview admin-slot-preview admin-story-preview" src="${escapeAttr(preview)}" alt="">
        <div class="admin-upload-row">
          <input type="file" class="admin-hero-file" data-hero-id="${escapeAttr(slot.id)}" accept="image/*" hidden>
          <button type="button" class="btn btn-ghost btn-sm admin-hero-pick" data-hero-id="${escapeAttr(slot.id)}">Replace image</button>
          <span class="admin-drop-hint">paste, drop, or pick</span>
        </div>
      </div>`;
      })
      .join("");

    mount.querySelectorAll(".admin-hero-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        mount.querySelector(`.admin-hero-file[data-hero-id="${btn.dataset.heroId}"]`)?.click();
      });
    });

    mount.querySelectorAll(".admin-hero-file").forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        this.stageHeroFile(input.dataset.heroId, file);
      });
    });

    mount.querySelectorAll(".admin-dropzone[data-hero-id]").forEach((zone) => {
      AdminUpload.bindImageZone(zone, (file) => this.stageHeroFile(zone.dataset.heroId, file));
    });
  },

  renderWhyHire(site, portfolio) {
    const mount = document.getElementById("admin-why-hire");
    const pillars = site?.whyHire?.pillars || [];
    if (!mount) return;

    mount.innerHTML = pillars
      .map((pillar, index) => {
        const preview = this.previewUrl(
          `why:${index}`,
          pillar.image ||
            portfolio.items.find((item) => item.id === pillar.portfolioItemId)?.image
        );
        const useCustom = Boolean(pillar.image);
        return `
          <div class="admin-slot-card admin-slot-card--wide admin-dropzone" data-why-index="${index}" tabindex="0">
            <div class="admin-slot-head">
              <strong>Pillar ${index + 1}</strong>
              <span class="admin-slot-meta">${escapeHtml(pillar.title || "")}</span>
            </div>
            <img class="admin-thumb-preview admin-slot-preview" src="${escapeAttr(preview)}" alt="">
            <label class="admin-field">
              <span class="admin-field-label">Image source</span>
              <select class="admin-why-source" data-why-index="${index}">
                <option value="portfolio"${useCustom ? "" : " selected"}>Portfolio thumbnail</option>
                <option value="custom"${useCustom ? " selected" : ""}>Custom upload</option>
              </select>
            </label>
            <label class="admin-field admin-why-portfolio-wrap"${useCustom ? " hidden" : ""}>
              <span class="admin-field-label">Portfolio item</span>
              <select class="admin-why-item" data-why-index="${index}">
                ${this.portfolioOptions(portfolio, pillar.portfolioItemId)}
              </select>
            </label>
            <div class="admin-upload-row admin-why-upload-wrap"${useCustom ? "" : " hidden"}>
              <input type="file" class="admin-why-file" data-why-index="${index}" accept="image/*" hidden>
              <button type="button" class="btn btn-ghost btn-sm admin-why-pick" data-why-index="${index}">Upload image</button>
              <span class="admin-drop-hint">paste, drop, or pick</span>
            </div>
          </div>`;
      })
      .join("");

    mount.querySelectorAll(".admin-why-source").forEach((select) => {
      select.addEventListener("change", () => {
        const index = parseInt(select.dataset.whyIndex, 10);
        const pillar = site.whyHire.pillars[index];
        const card = select.closest(".admin-slot-card");
        const isCustom = select.value === "custom";
        card.querySelector(".admin-why-portfolio-wrap").hidden = isCustom;
        card.querySelector(".admin-why-upload-wrap").hidden = !isCustom;
        if (isCustom) {
          delete pillar.portfolioItemId;
        } else {
          delete pillar.image;
          const itemSelect = card.querySelector(".admin-why-item");
          if (itemSelect?.value) pillar.portfolioItemId = itemSelect.value;
        }
        if (typeof markDirty === "function") markDirty();
      });
    });

    mount.querySelectorAll(".admin-why-item").forEach((select) => {
      select.addEventListener("change", () => {
        const index = parseInt(select.dataset.whyIndex, 10);
        const pillar = site.whyHire.pillars[index];
        pillar.portfolioItemId = select.value;
        delete pillar.image;
        if (typeof markDirty === "function") markDirty();
        this.renderWhyHire(site, portfolio);
      });
    });

    mount.querySelectorAll(".admin-why-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = btn.dataset.whyIndex;
        mount.querySelector(`.admin-why-file[data-why-index="${index}"]`)?.click();
      });
    });

    mount.querySelectorAll(".admin-why-file").forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        this.stageWhyFile(parseInt(input.dataset.whyIndex, 10), file, site, portfolio);
      });
    });

    mount.querySelectorAll(".admin-dropzone[data-why-index]").forEach((zone) => {
      AdminUpload.bindImageZone(zone, (file) => {
        const index = parseInt(zone.dataset.whyIndex, 10);
        const card = zone.closest(".admin-slot-card");
        const source = card?.querySelector(".admin-why-source");
        if (source?.value !== "custom") {
          source.value = "custom";
          source.dispatchEvent(new Event("change", { bubbles: true }));
        }
        this.stageWhyFile(index, file, site, portfolio);
      });
    });
  },

  render(site, portfolio) {
    this.renderWallSlots(portfolio);
    this.renderHeroLottie();
    this.renderWhyHire(site, portfolio);
  },

  async save(site, portfolio) {
    for (const [key, file] of this.pending.entries()) {
      if (!key.startsWith("file:")) continue;
      const kind = key.replace("file:", "");

      if (kind.startsWith("wall:")) {
        const slot = parseInt(kind.split(":")[1], 10);
        let item = this.getSlotItem(portfolio, slot);
        if (!item) throw new Error(`Assign a portfolio item to slot ${slot} before uploading.`);
        const ext = GitHubStore.extFromFile(file);
        const path = GitHubStore.thumbImagePath(item.id, "A", ext);
        await GitHubStore.uploadImage(path, file);
        item.image = path;
        item.variants = item.variants || [{ label: "A", image: path }];
        item.variants[0].image = path;
      }

      if (kind.startsWith("why:")) {
        const index = parseInt(kind.split(":")[1], 10);
        const ext = GitHubStore.extFromFile(file);
        const path = GitHubStore.whyHireImagePath(index, ext);
        await GitHubStore.uploadImage(path, file);
        const pillar = site.whyHire.pillars[index];
        pillar.image = path;
        delete pillar.portfolioItemId;
      }

      if (kind.startsWith("hero:")) {
        const id = kind.split(":")[1];
        const slot = this.heroLottieSlots().find((s) => s.id === id);
        if (!slot) continue;
        await GitHubStore.uploadImage(slot.path, file);
      }
    }

    await GitHubStore.savePortfolio(portfolio, "admin: update homepage wall images");
    await GitHubStore.saveSite(site, "admin: update why hire images");
    this.clearPending();
  },
};

window.AdminHomepage = AdminHomepage;
