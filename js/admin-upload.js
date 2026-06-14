/**
 * Shared drag-drop and clipboard paste for admin image upload zones.
 */
const AdminUpload = {
  activeZone: null,
  handlers: new WeakMap(),
  documentPasteBound: false,

  isImageFile(file) {
    return Boolean(file?.type?.startsWith("image/"));
  },

  fileFromClipboard(event) {
    const items = event.clipboardData?.items;
    if (!items) return null;
    for (const item of items) {
      if (item.type?.startsWith("image/")) return item.getAsFile();
    }
    return null;
  },

  setActiveZone(zone) {
    if (this.activeZone === zone) return;
    this.activeZone?.classList.remove("is-paste-target");
    this.activeZone = zone || null;
    zone?.classList.add("is-paste-target");
  },

  bindImageZone(zone, onFile) {
    if (!zone || this.handlers.has(zone)) return;
    this.handlers.set(zone, onFile);
    if (!zone.classList.contains("admin-dropzone")) zone.classList.add("admin-dropzone");
    if (!zone.hasAttribute("tabindex")) zone.tabIndex = 0;

    zone.addEventListener("pointerdown", () => this.setActiveZone(zone));
    zone.addEventListener("focus", () => this.setActiveZone(zone));

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("is-dragover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("is-dragover");
      const file = e.dataTransfer?.files?.[0];
      if (this.isImageFile(file)) onFile(file);
    });

    zone.addEventListener("paste", (e) => {
      const file = this.fileFromClipboard(e);
      if (!file) return;
      e.preventDefault();
      onFile(file);
    });
  },

  initDocumentPaste() {
    if (this.documentPasteBound) return;
    this.documentPasteBound = true;
    document.addEventListener("paste", (e) => {
      if (e.defaultPrevented) return;
      if (e.target.closest("input, textarea, select, [contenteditable='true']")) return;
      const file = this.fileFromClipboard(e);
      if (!file) return;
      const zone = this.activeZone;
      if (!zone) return;
      const onFile = this.handlers.get(zone);
      if (!onFile) return;
      e.preventDefault();
      onFile(file);
    });
  },
};

window.AdminUpload = AdminUpload;
