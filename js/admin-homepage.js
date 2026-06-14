/**
 * Admin panel — homepage thumbnail wall (10 image slots, no portfolio metadata).
 */
const AdminHomepage = {
  pending: new Map(),

  clearPending() {
    this.pending.forEach((url) => {
      if (String(url).startsWith("blob:")) URL.revokeObjectURL(url);
    });
    this.pending.clear();
  },

  hasPending() {
    return [...this.pending.keys()].some((k) => k.startsWith("file:"));
  },

  wallImages(site) {
    const wall = Array.isArray(site?.homepageWall) ? [...site.homepageWall] : [];
    while (wall.length < 10) wall.push("");
    return wall.slice(0, 10);
  },

  previewUrl(key, fallbackPath) {
    if (this.pending.has(`blob:${key}`)) return this.pending.get(`blob:${key}`);
    return fallbackPath ? itemImageUrl(fallbackPath) : itemImageUrl("../assets/placeholder-thumb.svg");
  },

  stageWallFile(slot, file) {
    const key = `wall:${slot}`;
    if (this.pending.has(`blob:${key}`)) URL.revokeObjectURL(this.pending.get(`blob:${key}`));
    this.pending.set(`blob:${key}`, URL.createObjectURL(file));
    this.pending.set(`file:${key}`, file);
    if (typeof markDirty === "function") markDirty();
    this.renderWallSlots(window.__adminSite);
  },

  renderWallSlots(site) {
    window.__adminSite = site;
    const mount = document.getElementById("admin-wall-slots");
    if (!mount) return;

    const images = this.wallImages(site);

    mount.innerHTML = images
      .map((imagePath, i) => {
        const slot = i + 1;
        const preview = this.previewUrl(`wall:${slot}`, imagePath);
        return `
        <div class="admin-slot-card admin-dropzone" data-wall-slot="${slot}" tabindex="0">
          <div class="admin-slot-head">
            <strong>Slot ${slot}</strong>
          </div>
          <img class="admin-thumb-preview admin-slot-preview" src="${escapeAttr(preview)}" alt="">
          <div class="admin-upload-row">
            <input type="file" class="admin-wall-file" data-wall-slot="${slot}" accept="image/*" hidden>
            <button type="button" class="btn btn-ghost btn-sm admin-wall-pick" data-wall-slot="${slot}">Upload image</button>
            <span class="admin-drop-hint">paste, drop, or pick</span>
          </div>
        </div>`;
      })
      .join("");

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
        this.stageWallFile(parseInt(input.dataset.wallSlot, 10), file);
      });
    });

    mount.querySelectorAll(".admin-dropzone[data-wall-slot]").forEach((zone) => {
      AdminUpload.bindImageZone(zone, (file) =>
        this.stageWallFile(parseInt(zone.dataset.wallSlot, 10), file)
      );
    });
  },

  render(site) {
    this.renderWallSlots(site);
  },

  async save(site) {
    site.homepageWall = this.wallImages(site);

    for (const [key, file] of this.pending.entries()) {
      if (!key.startsWith("file:")) continue;
      const kind = key.replace("file:", "");
      if (!kind.startsWith("wall:")) continue;

      const slot = parseInt(kind.split(":")[1], 10);
      const ext = GitHubStore.extFromFile(file);
      const path = GitHubStore.homepageWallImagePath(slot, ext);
      await GitHubStore.uploadImage(path, file);
      site.homepageWall[slot - 1] = path;
    }

    await GitHubStore.saveSite(site, "admin: update homepage wall images");
    this.clearPending();
  },
};

window.AdminHomepage = AdminHomepage;
