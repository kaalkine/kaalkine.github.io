const VIEW_PRESETS = ["100k+ views", "250k+ views", "300k+ views", "500k+ views", "1M+ views"];
const VARIANT_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const state = {
  data: null,
  site: null,
  selectedId: null,
  draft: null,
  savedSnapshot: null,
  categoryFilter: "",
  pendingUploads: new Map(),
  channelIconFile: null,
  channelIconCleared: false,
  saving: false,
  dirty: false,
};

const els = {};

function $(id) {
  return document.getElementById(id);
}

function showToast(message, type = "success") {
  const toast = $("admin-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `admin-toast is-${type}`;
  toast.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

function setStatus(text) {
  if (!els.status) return;
  const parts = [text].filter(Boolean);
  if (state.data?.items) {
    parts.push(`${state.data.items.length} thumbnails`);
  }
  if (hasUnsavedChanges()) parts.push("Unsaved changes");
  els.status.textContent = parts.join(" · ");
}

function snapshotDraft() {
  if (!state.draft) return "";
  readEditorIntoDraft();
  return JSON.stringify(state.draft);
}

function hasUnsavedChanges() {
  if (state.pendingUploads.size || state.channelIconFile || state.channelIconCleared) return true;
  if (AdminHomepage.hasPending()) return true;
  if (!state.draft || !state.savedSnapshot) return false;
  return snapshotDraft() !== state.savedSnapshot;
}

function markDirty() {
  state.dirty = true;
  updateSaveButtonState();
  setStatus();
}

function clearDirty() {
  state.dirty = false;
  state.savedSnapshot = state.draft ? JSON.stringify(state.draft) : null;
  updateSaveButtonState();
  setStatus();
}

function updateSaveButtonState() {
  const saveBtn = $("admin-save-item");
  const homeBtn = $("admin-homepage-save");
  const dirty = hasUnsavedChanges();
  if (saveBtn) saveBtn.classList.toggle("is-dirty", dirty && state.draft);
  if (homeBtn) homeBtn.classList.toggle("is-dirty", AdminHomepage.hasPending());
}

function cloneItem(item) {
  return JSON.parse(JSON.stringify(item));
}

function nextThumbId() {
  const nums = (state.data?.items || [])
    .map((i) => parseInt(String(i.id).replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `thumb-${String(next).padStart(2, "0")}`;
}

function itemImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("blob:")) return path;
  const base = document.querySelector('meta[name="admin-base"]')?.content || "..";
  return `${base}/${path}`.replace(/([^:]\/)\/+/g, "$1");
}

function showGate() {
  els.gate.hidden = false;
  els.shell.hidden = true;
}

function showShell() {
  els.gate.hidden = true;
  els.shell.hidden = false;
}

function clearPending() {
  state.pendingUploads.forEach((url) => {
    if (String(url).startsWith("blob:")) URL.revokeObjectURL(url);
  });
  state.pendingUploads.clear();
  state.channelIconFile = null;
  state.channelIconCleared = false;
}

function getViewsFromForm() {
  const preset = $("field-views-preset")?.value || "";
  if (preset === "custom") return $("field-views-custom")?.value.trim() || "";
  return preset;
}

function syncViewsFields(item) {
  const presetEl = $("field-views-preset");
  const customWrap = $("field-views-custom-wrap");
  const customEl = $("field-views-custom");
  if (!presetEl) return;

  const views = item?.views || "";
  if (!views) {
    presetEl.value = "";
    customWrap.hidden = true;
    customEl.value = "";
    return;
  }
  if (VIEW_PRESETS.includes(views)) {
    presetEl.value = views;
    customWrap.hidden = true;
    customEl.value = "";
  } else {
    presetEl.value = "custom";
    customWrap.hidden = false;
    customEl.value = views;
  }
}

function syncNicheFields(item) {
  const select = $("field-niche");
  const customWrap = $("field-niche-custom-wrap");
  const customEl = $("field-niche-custom");
  if (!select) return;

  fillNicheSelect(item?.niche);

  const niche = item?.niche || "";
  if (!niche) {
    select.value = state.data?.niches?.[0] || "";
    customWrap.hidden = true;
    customEl.value = "";
    return;
  }
  if (state.data?.niches?.includes(niche)) {
    select.value = niche;
    customWrap.hidden = true;
    customEl.value = "";
  } else {
    select.value = "custom";
    customWrap.hidden = false;
    customEl.value = niche;
  }
}

function getNicheFromForm() {
  const select = $("field-niche");
  if (!select) return "";
  if (select.value === "custom") {
    return $("field-niche-custom")?.value.trim() || "";
  }
  return select.value;
}

function normalizeNicheName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function ensureNicheRegistered(niche) {
  const value = normalizeNicheName(niche);
  if (!value || !state.data) return value;
  if (!state.data.niches) state.data.niches = [];
  if (!state.data.niches.includes(value)) {
    state.data.niches.push(value);
    state.data.niches.sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
  }
  return value;
}

function syncChannelFields() {
  const show = $("field-show-channel")?.checked;
  const wrap = $("channel-fields");
  if (wrap) wrap.classList.toggle("is-hidden", !show);
}

function stageVariantFile(idx, file) {
  const key = `variant:${idx}`;
  if (state.pendingUploads.has(key)) URL.revokeObjectURL(state.pendingUploads.get(key));
  state.pendingUploads.set(key, URL.createObjectURL(file));
  state.pendingUploads.set(`file:variant:${idx}`, file);
  markDirty();
  renderVariants();
}

function stageChannelIcon(file) {
  state.channelIconFile = file;
  state.channelIconCleared = false;
  markDirty();
  const preview = $("channel-icon-preview");
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  $("channel-icon-clear").hidden = false;
}

function renderVariantRow(variant, index, canRemove) {
  const label = variant.label || VARIANT_LABELS[index] || "?";
  const previewSrc =
    state.pendingUploads.get(`variant:${index}`) ||
    itemImageUrl(variant.image) ||
    itemImageUrl("../assets/placeholder-thumb.svg");

  return `
    <div class="admin-variant-row admin-dropzone" data-variant-index="${index}" tabindex="0">
      <span class="admin-variant-label">${escapeHtml(label)}</span>
      <div class="admin-upload-row">
        <img class="admin-thumb-preview" src="${escapeAttr(previewSrc)}" alt="Variant ${escapeAttr(label)} preview">
        <input type="file" class="admin-variant-file" data-variant-index="${index}" accept="image/*" hidden>
        <button type="button" class="btn btn-ghost btn-sm admin-variant-pick" data-variant-index="${index}">Replace image</button>
        <span class="admin-drop-hint">paste, drop, or pick</span>
      </div>
      ${canRemove ? `<button type="button" class="btn btn-ghost btn-sm admin-variant-remove" data-variant-index="${index}" aria-label="Remove variant ${escapeAttr(label)}">Remove</button>` : "<span></span>"}
    </div>`;
}

function renderVariants() {
  const mount = $("admin-variants");
  if (!mount || !state.draft) return;
  const variants = state.draft.variants || [{ label: "A", image: state.draft.image }];
  mount.innerHTML = variants
    .map((v, i) => renderVariantRow(v, i, variants.length > 1))
    .join("");

  mount.querySelectorAll(".admin-variant-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.variantIndex, 10);
      mount.querySelector(`.admin-variant-file[data-variant-index="${idx}"]`)?.click();
    });
  });

  mount.querySelectorAll(".admin-variant-file").forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      stageVariantFile(parseInt(input.dataset.variantIndex, 10), file);
    });
  });

  mount.querySelectorAll(".admin-variant-row.admin-dropzone").forEach((row) => {
    AdminUpload.bindImageZone(row, (file) =>
      stageVariantFile(parseInt(row.dataset.variantIndex, 10), file)
    );
  });

  mount.querySelectorAll(".admin-variant-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.variantIndex, 10);
      state.draft.variants.splice(idx, 1);
      state.draft.variants = state.draft.variants.map((v, i) => ({
        ...v,
        label: VARIANT_LABELS[i],
      }));
      state.draft.image = state.draft.variants[0]?.image || state.draft.image;
      markDirty();
      renderVariants();
    });
  });
}

function fillCategoryFilter() {
  const select = $("admin-category-filter");
  if (!select || !state.data?.niches) return;
  const current = state.categoryFilter;
  select.innerHTML = [
    `<option value="">All categories</option>`,
    ...state.data.niches.map((n) => `<option value="${escapeAttr(n)}">${escapeHtml(n)}</option>`),
  ].join("");
  select.value = current;
}

function renderItemList() {
  const list = $("admin-item-list");
  const query = ($("admin-search")?.value || "").trim().toLowerCase();
  const category = state.categoryFilter;
  if (!list || !state.data) return;

  const items = state.data.items.filter((item) => {
    if (category && item.niche !== category) return false;
    if (!query) return true;
    return (
      (item.title || "").toLowerCase().includes(query) ||
      (item.niche || "").toLowerCase().includes(query) ||
      (item.client || "").toLowerCase().includes(query)
    );
  });

  if (!items.length) {
    list.innerHTML = `<li class="admin-list-empty">No thumbnails match your filters.</li>`;
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const thumb = itemImageUrl(item.image) || itemImageUrl("../assets/placeholder-thumb.svg");
      return `
    <li>
      <button type="button" class="admin-item-btn${item.id === state.selectedId ? " is-active" : ""}" data-id="${escapeAttr(item.id)}">
        <img class="admin-item-thumb" src="${escapeAttr(thumb)}" alt="" loading="lazy">
        <span class="admin-item-copy">
          <span class="admin-item-title">${escapeHtml(item.title || item.id)}</span>
          <small>${escapeHtml(item.niche || "")}</small>
        </span>
      </button>
    </li>`;
    })
    .join("");

  list.querySelectorAll(".admin-item-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectItem(btn.dataset.id));
  });
}

function populateEditor(item) {
  $("field-title").value = item.title || "";
  syncNicheFields(item);
  $("field-date").value = item.date || new Date().toISOString().slice(0, 10);
  $("field-show-channel").checked = item.showChannel !== false;
  $("field-client").value = item.client || "";
  syncViewsFields(item);
  syncChannelFields();

  const channelPreview = $("channel-icon-preview");
  const channelClear = $("channel-icon-clear");
  if (item.channelIcon && !state.channelIconCleared) {
    channelPreview.src = itemImageUrl(item.channelIcon);
    channelPreview.hidden = false;
    channelClear.hidden = false;
  } else if (state.channelIconFile) {
    channelPreview.src = URL.createObjectURL(state.channelIconFile);
    channelPreview.hidden = false;
    channelClear.hidden = false;
  } else {
    channelPreview.hidden = true;
    channelClear.hidden = true;
  }

  renderVariants();
}

function selectItem(id, { skipDirtyCheck = false } = {}) {
  if (!skipDirtyCheck && hasUnsavedChanges()) {
    if (!window.confirm("You have unsaved changes. Discard them and switch items?")) return;
  }

  const item = state.data.items.find((i) => i.id === id);
  if (!item) return;

  clearPending();
  state.selectedId = id;
  state.draft = cloneItem(item);
  state.savedSnapshot = JSON.stringify(state.draft);

  els.editor.hidden = false;
  els.empty.hidden = true;
  $("admin-editor-title").textContent = `Edit: ${item.title || item.id}`;

  populateEditor(state.draft);
  renderItemList();
  clearDirty();
}

function addNewItem() {
  const id = nextThumbId();
  const today = new Date().toISOString().slice(0, 10);
  const niche = state.data.niches[0] || "Other";
  const image = `${GitHubStore.config.assetsDir}/${id}.jpg`;

  const item = {
    id,
    title: "New video title",
    client: "",
    views: "",
    niche,
    date: today,
    image,
    showChannel: true,
    variants: [{ label: "A", image }],
  };

  state.data.items.unshift(item);
  selectItem(id, { skipDirtyCheck: true });
  markDirty();
  renderItemList();
}

function duplicateItem() {
  if (!state.draft) return;
  readEditorIntoDraft();
  const id = nextThumbId();
  const image = `${GitHubStore.config.assetsDir}/${id}.jpg`;
  const copy = cloneItem(state.draft);
  copy.id = id;
  copy.title = `${copy.title || "Thumbnail"} (copy)`;
  copy.image = image;
  copy.variants = (copy.variants || [{ label: "A", image }]).map((v, i) => ({
    label: VARIANT_LABELS[i] || "A",
    image: GitHubStore.thumbImagePath(id, VARIANT_LABELS[i] || "A", ".jpg"),
  }));
  copy.image = copy.variants[0].image;
  delete copy.channelIcon;
  state.data.items.unshift(copy);
  selectItem(id, { skipDirtyCheck: true });
  markDirty();
  renderItemList();
  showToast("Duplicate created — upload images and save");
}

function readEditorIntoDraft() {
  if (!state.draft) return;

  state.draft.title = $("field-title").value.trim();
  state.draft.niche = ensureNicheRegistered(getNicheFromForm());
  state.draft.date = $("field-date").value;
  state.draft.views = getViewsFromForm();
  state.draft.showChannel = $("field-show-channel").checked;
  state.draft.client = $("field-client").value.trim();

  if (!state.draft.showChannel) {
    delete state.draft.channelIcon;
  } else if (state.channelIconCleared) {
    delete state.draft.channelIcon;
  }
}

async function uploadPendingFiles() {
  const { draft } = state;
  if (!draft) return;

  for (const [key, file] of state.pendingUploads.entries()) {
    if (!key.startsWith("file:")) continue;
    const kind = key.replace("file:", "");
    const ext = GitHubStore.extFromFile(file);

    if (kind.startsWith("variant:")) {
      const idx = parseInt(kind.split(":")[1], 10);
      const variant = draft.variants[idx];
      if (!variant) continue;
      const label = variant.label || VARIANT_LABELS[idx];
      const path = GitHubStore.thumbImagePath(draft.id, label, ext);
      await GitHubStore.uploadImage(path, file);
      variant.image = path;
      if (idx === 0) draft.image = path;
    }
  }

  if (state.channelIconFile && draft.showChannel !== false) {
    const ext = GitHubStore.extFromFile(state.channelIconFile);
    const path = GitHubStore.channelIconPath(draft.id, ext);
    await GitHubStore.uploadImage(path, state.channelIconFile);
    draft.channelIcon = path;
  }
}

async function saveItem(e) {
  e?.preventDefault();
  if (state.saving || !state.draft) return;

  readEditorIntoDraft();
  if (!state.draft.niche) {
    showToast("Choose or enter a category", "error");
    return;
  }

  const idx = state.data.items.findIndex((i) => i.id === state.draft.id);
  if (idx < 0) return;

  state.saving = true;
  setStatus("Saving…");
  $("admin-editor")?.querySelectorAll("button, input, select").forEach((el) => {
    el.disabled = true;
  });

  try {
    await uploadPendingFiles();
    state.data.items[idx] = cloneItem(state.draft);
    await GitHubStore.savePortfolio(state.data, `admin: update ${state.draft.id}`);
    clearPending();
    showToast(`Saved ${state.draft.title}`);
    setStatus("Saved");
    fillNicheSelect(state.draft.niche);
    fillCategoryFilter();
    renderNicheList();
    renderItemList();
    populateEditor(state.data.items[idx]);
    state.draft = cloneItem(state.data.items[idx]);
    clearDirty();
    AdminHomepage.render(state.site, state.data);
    updateSaveButtonState();
  } catch (err) {
    console.error(err);
    showToast(err.message || "Save failed", "error");
    setStatus("Save failed");
    if (String(err.message).includes("409") || String(err.message).toLowerCase().includes("sha")) {
      try {
        state.data = await GitHubStore.loadPortfolio();
        showToast("Data was updated elsewhere — reloaded from GitHub.", "error");
        selectItem(state.selectedId);
      } catch {
        /* ignore */
      }
    }
  } finally {
    state.saving = false;
    $("admin-editor")?.querySelectorAll("button, input, select").forEach((el) => {
      el.disabled = false;
    });
  }
}

async function deleteItem() {
  if (!state.draft) return;
  const title = state.draft.title || state.draft.id;
  if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;

  state.saving = true;
  setStatus("Deleting…");
  try {
    state.data.items = state.data.items.filter((i) => i.id !== state.draft.id);
    await GitHubStore.savePortfolio(state.data, `admin: delete ${state.draft.id}`);
    clearPending();
    state.selectedId = null;
    state.draft = null;
    els.editor.hidden = true;
    els.empty.hidden = false;
    showToast(`Deleted ${title}`);
    setStatus("Deleted");
    renderItemList();
  } catch (err) {
    console.error(err);
    showToast(err.message || "Delete failed", "error");
  } finally {
    state.saving = false;
  }
}

function discardChanges() {
  if (!state.selectedId) return;
  selectItem(state.selectedId);
  showToast("Changes discarded");
}

function fillNicheSelect(currentNiche) {
  const select = $("field-niche");
  if (!select || !state.data?.niches) return;
  const niches = [...state.data.niches];
  const current = normalizeNicheName(currentNiche);
  if (current && !niches.includes(current)) niches.push(current);

  select.innerHTML = [
    ...niches.map((n) => `<option value="${escapeAttr(n)}">${escapeHtml(n)}</option>`),
    `<option value="custom">Custom category…</option>`,
  ].join("");
}

function renderNicheList() {
  const list = $("admin-niche-list");
  if (!list || !state.data?.niches) return;

  list.innerHTML = state.data.niches
    .map(
      (niche) => `
      <li class="admin-niche-item">
        <span>${escapeHtml(niche)}</span>
        <button type="button" class="btn btn-ghost btn-sm admin-niche-remove" data-niche="${escapeAttr(niche)}" aria-label="Remove ${escapeAttr(niche)}">Remove</button>
      </li>`
    )
    .join("");

  list.querySelectorAll(".admin-niche-remove").forEach((btn) => {
    btn.addEventListener("click", () => removeNiche(btn.dataset.niche));
  });
}

async function addNicheFromInput() {
  const input = $("admin-new-niche");
  const value = normalizeNicheName(input?.value);
  if (!value) {
    showToast("Enter a category name", "error");
    return;
  }
  ensureNicheRegistered(value);
  if (input) input.value = "";
  fillNicheSelect(state.draft?.niche);
  fillCategoryFilter();
  renderNicheList();
  await persistCategories(`admin: add category ${value}`);
}

async function persistCategories(message) {
  try {
    await GitHubStore.savePortfolio(state.data, message);
    showToast("Categories updated");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Failed to save categories", "error");
  }
}

function removeNiche(niche) {
  if (!state.data?.niches || !niche) return;
  const inUse = state.data.items.some((item) => item.niche === niche);
  if (inUse) {
    showToast(`“${niche}” is used by thumbnails — reassign them first`, "error");
    return;
  }
  if (!window.confirm(`Remove category “${niche}”?`)) return;
  state.data.niches = state.data.niches.filter((n) => n !== niche);
  fillNicheSelect(state.draft?.niche);
  fillCategoryFilter();
  renderNicheList();
  void persistCategories(`admin: remove category ${niche}`);
}

async function loadPortfolio() {
  setStatus("Loading…");
  const [portfolio, site] = await Promise.all([
    GitHubStore.loadPortfolio(),
    GitHubStore.loadSite(),
  ]);
  state.data = portfolio;
  state.site = site;
  fillNicheSelect();
  fillCategoryFilter();
  renderNicheList();
  renderItemList();
  AdminHomepage.render(state.site);
  updateSaveButtonState();
  setStatus("Ready");
}

function switchTab(tab, { silent = false } = {}) {
  if (!silent && hasUnsavedChanges()) {
    if (!window.confirm("You have unsaved changes. Switch tabs anyway?")) return;
  }

  sessionStorage.setItem("kaalkine_admin_tab", tab);
  const portfolioPanel = document.getElementById("admin-panel-portfolio");
  const homepagePanel = document.getElementById("admin-panel-homepage");
  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === tab);
  });
  if (portfolioPanel) portfolioPanel.hidden = tab !== "portfolio";
  if (homepagePanel) homepagePanel.hidden = tab !== "homepage";
}

async function saveHomepageSections() {
  if (state.saving || !state.site) return;

  state.saving = true;
  setStatus("Saving homepage wall…");
  $("admin-homepage-save").disabled = true;

  try {
    await AdminHomepage.save(state.site);
    showToast("Homepage wall saved");
    setStatus("Saved");
    AdminHomepage.clearPending();
    updateSaveButtonState();
    AdminHomepage.render(state.site);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Save failed", "error");
    setStatus("Save failed");
  } finally {
    state.saving = false;
    $("admin-homepage-save").disabled = false;
  }
}

async function reloadFromGitHub() {
  if (hasUnsavedChanges() && !window.confirm("Reload from GitHub and discard unsaved changes?")) return;
  clearPending();
  AdminHomepage.clearPending();
  state.selectedId = null;
  state.draft = null;
  els.editor.hidden = true;
  els.empty.hidden = false;
  await loadPortfolio();
  showToast("Reloaded from GitHub");
}

async function unlockWithToken(token) {
  GitHubStore.setToken(token.trim());
  await GitHubStore.testConnection();
  showShell();
  await loadPortfolio();
  const savedTabRaw = sessionStorage.getItem("kaalkine_admin_tab");
  const savedTab = savedTabRaw === "story" ? "portfolio" : savedTabRaw;
  if (savedTab) switchTab(savedTab, { silent: true });
}

function bindEvents() {
  AdminUpload.initDocumentPaste();

  const channelZone = $("channel-icon-zone");
  if (channelZone) {
    AdminUpload.bindImageZone(channelZone, stageChannelIcon);
  }
  $("admin-auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = $("admin-auth-error");
    errEl.hidden = true;
    const token = $("github-token")?.value || "";
    try {
      await unlockWithToken(token);
    } catch (err) {
      GitHubStore.clearToken();
      errEl.textContent = err.message || "Could not connect to GitHub.";
      errEl.hidden = false;
    }
  });

  $("admin-sign-out")?.addEventListener("click", () => {
    GitHubStore.clearToken();
    state.data = null;
    state.site = null;
    state.selectedId = null;
    state.draft = null;
    clearPending();
    AdminHomepage.clearPending();
    showGate();
    $("github-token").value = "";
  });

  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab || "portfolio"));
  });

  $("admin-homepage-save")?.addEventListener("click", saveHomepageSections);
  $("admin-reload")?.addEventListener("click", reloadFromGitHub);

  $("admin-search")?.addEventListener("input", renderItemList);
  $("admin-category-filter")?.addEventListener("change", (e) => {
    state.categoryFilter = e.target.value;
    renderItemList();
  });
  $("admin-add")?.addEventListener("click", addNewItem);
  document.querySelector(".admin-empty-add")?.addEventListener("click", addNewItem);
  $("admin-duplicate")?.addEventListener("click", duplicateItem);
  $("admin-editor")?.addEventListener("submit", saveItem);
  $("admin-editor")?.addEventListener("input", markDirty);
  $("admin-editor")?.addEventListener("change", markDirty);
  $("admin-discard")?.addEventListener("click", discardChanges);
  $("admin-delete")?.addEventListener("click", deleteItem);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (document.getElementById("admin-panel-homepage") && !document.getElementById("admin-panel-homepage").hidden) {
        saveHomepageSections();
      } else if (state.draft) {
        saveItem();
      }
    }
  });

  window.addEventListener("beforeunload", (e) => {
    if (!hasUnsavedChanges()) return;
    e.preventDefault();
    e.returnValue = "";
  });

  $("field-views-preset")?.addEventListener("change", () => {
    const customWrap = $("field-views-custom-wrap");
    customWrap.hidden = $("field-views-preset").value !== "custom";
  });

  $("field-niche")?.addEventListener("change", () => {
    const customWrap = $("field-niche-custom-wrap");
    customWrap.hidden = $("field-niche").value !== "custom";
  });

  $("admin-add-niche")?.addEventListener("click", addNicheFromInput);
  $("admin-new-niche")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNicheFromInput();
    }
  });

  $("field-show-channel")?.addEventListener("change", syncChannelFields);

  $("admin-add-variant")?.addEventListener("click", () => {
    if (!state.draft) return;
    const variants = state.draft.variants || [{ label: "A", image: state.draft.image }];
    if (variants.length >= 5) {
      showToast("Maximum 5 variants", "error");
      return;
    }
    const label = VARIANT_LABELS[variants.length];
    const ext = ".jpg";
    const image = GitHubStore.thumbImagePath(state.draft.id, label, ext);
    variants.push({ label, image });
    state.draft.variants = variants;
    markDirty();
    renderVariants();
  });

  $("channel-icon-pick")?.addEventListener("click", () => {
    $("field-channel-icon")?.click();
  });

  $("field-channel-icon")?.addEventListener("change", () => {
    const file = $("field-channel-icon").files?.[0];
    if (!file) return;
    stageChannelIcon(file);
  });

  $("channel-icon-clear")?.addEventListener("click", () => {
    state.channelIconFile = null;
    state.channelIconCleared = true;
    markDirty();
    $("field-channel-icon").value = "";
    $("channel-icon-preview").hidden = true;
    $("channel-icon-clear").hidden = true;
  });
}

function cacheElements() {
  els.gate = $("admin-gate");
  els.shell = $("admin-shell");
  els.editor = $("admin-editor");
  els.empty = $("admin-empty");
  els.status = $("admin-status");
}

async function initAdmin() {
  cacheElements();
  bindEvents();

  try {
    await GitHubStore.loadConfig();
  } catch (err) {
    showGate();
    const errEl = $("admin-auth-error");
    errEl.textContent = err.message || "Failed to load admin config.";
    errEl.hidden = false;
    return;
  }

  showGate();
  els.gate.hidden = false;

  if (GitHubStore.isAuthenticated()) {
    try {
      await unlockWithToken(GitHubStore.getToken());
      return;
    } catch {
      GitHubStore.clearToken();
    }
  }
}

document.addEventListener("DOMContentLoaded", initAdmin);
window.markDirty = () => markDirty();
