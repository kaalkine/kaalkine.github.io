/**
 * Admin panel — My Story page illustrations.
 */
const AdminStory = {
  pending: new Map(),

  slots() {
    const cfg = GitHubStore.config || {};
    return [
      {
        id: "bobble-body",
        label: "Hero — body",
        path: cfg.storyBobbleBodyPath || "my_story_page/image_one_body.png",
        hint: "Used for the story bobblehead only. After saving, run npm run build:story-bobble-lottie.",
      },
      {
        id: "bobble-head",
        label: "Hero — head",
        path: cfg.storyBobbleHeadPath || "my_story_page/image_one_head.png",
        hint: "Placed above the body in the bobblehead animation (My Story page only).",
      },
      {
        id: "studied",
        label: "“I trained for this…”",
        path: `${cfg.storyImagesDir || "assets/story"}/second-image.png`,
      },
      {
        id: "advantage",
        label: "“My unfair advantage”",
        path: `${cfg.storyImagesDir || "assets/story"}/half-face.png`,
      },
      {
        id: "playground",
        label: "“Your channel, my playground”",
        path: `${cfg.storyImagesDir || "assets/story"}/last-image.png`,
      },
    ];
  },

  clearPending() {
    this.pending.forEach((url) => {
      if (String(url).startsWith("blob:")) URL.revokeObjectURL(url);
    });
    this.pending.clear();
  },

  hasPending() {
    return [...this.pending.keys()].some((k) => k.startsWith("file:"));
  },

  previewFor(slot) {
    const key = `blob:${slot.id}`;
    if (this.pending.has(key)) return this.pending.get(key);
    return itemImageUrl(slot.path);
  },

  render() {
    const mount = document.getElementById("admin-story-slots");
    if (!mount) return;

    mount.innerHTML = this.slots()
      .map(
        (slot) => `
        <div class="admin-slot-card admin-slot-card--wide admin-dropzone" data-story-id="${escapeAttr(slot.id)}">
          <div class="admin-slot-head">
            <strong>${escapeHtml(slot.label)}</strong>
            <span class="admin-slot-meta">${escapeHtml(slot.path)}</span>
          </div>
          <img class="admin-thumb-preview admin-slot-preview admin-story-preview" src="${escapeAttr(this.previewFor(slot))}" alt="">
          ${slot.hint ? `<p class="admin-slot-hint">${escapeHtml(slot.hint)}</p>` : ""}
          <div class="admin-upload-row">
            <input type="file" class="admin-story-file" data-story-id="${escapeAttr(slot.id)}" accept="image/*" hidden>
            <button type="button" class="btn btn-ghost btn-sm admin-story-pick" data-story-id="${escapeAttr(slot.id)}">Replace image</button>
            <span class="admin-drop-hint">paste, drop, or pick</span>
          </div>
        </div>`
      )
      .join("");

    mount.querySelectorAll(".admin-story-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        mount.querySelector(`.admin-story-file[data-story-id="${btn.dataset.storyId}"]`)?.click();
      });
    });

    mount.querySelectorAll(".admin-story-file").forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        this.stageFile(input.dataset.storyId, file);
      });
    });

    mount.querySelectorAll(".admin-dropzone[data-story-id]").forEach((zone) => {
      AdminUpload.bindImageZone(zone, (file) => this.stageFile(zone.dataset.storyId, file));
    });
  },

  stageFile(id, file) {
    const key = `blob:${id}`;
    if (this.pending.has(key)) URL.revokeObjectURL(this.pending.get(key));
    this.pending.set(key, URL.createObjectURL(file));
    this.pending.set(`file:${id}`, file);
    this.render();
    if (typeof markDirty === "function") markDirty();
  },

  async save() {
    for (const [key, file] of this.pending.entries()) {
      if (!key.startsWith("file:")) continue;
      const id = key.replace("file:", "");
      const slot = this.slots().find((s) => s.id === id);
      if (!slot) continue;
      await GitHubStore.uploadImage(slot.path, file);
    }
    this.clearPending();
  },
};

window.AdminStory = AdminStory;
