/**
 * GitHub Contents API — read/write portfolio data and images from the admin page.
 * PAT is stored in sessionStorage only; never committed to the repo.
 */
const GITHUB_TOKEN_KEY = "kaalkine_github_pat";
const GITHUB_API = "https://api.github.com";

const GitHubStore = {
  config: null,
  portfolioSha: null,
  siteSha: null,

  async loadConfig() {
    const base = document.querySelector('meta[name="admin-base"]')?.content || "..";
    const res = await fetch(`${base}/data/admin-config.json`);
    if (!res.ok) throw new Error("Failed to load admin config");
    this.config = await res.json();
    return this.config;
  },

  getToken() {
    return sessionStorage.getItem(GITHUB_TOKEN_KEY) || "";
  },

  setToken(token) {
    if (token) sessionStorage.setItem(GITHUB_TOKEN_KEY, token);
    else sessionStorage.removeItem(GITHUB_TOKEN_KEY);
  },

  clearToken() {
    sessionStorage.removeItem(GITHUB_TOKEN_KEY);
    this.portfolioSha = null;
    this.siteSha = null;
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  headers(json = false) {
    const h = {
      Authorization: `Bearer ${this.getToken()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (json) h["Content-Type"] = "application/json";
    return h;
  },

  repoUrl(path = "") {
    const { githubOwner, githubRepo } = this.config;
    const encoded = path
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    return `${GITHUB_API}/repos/${githubOwner}/${githubRepo}/contents/${encoded}`;
  },

  decodeContent(data) {
    if (!data?.content) return "";
    const raw = data.content.replace(/\n/g, "");
    return decodeURIComponent(escape(atob(raw)));
  },

  encodeContent(text) {
    return btoa(unescape(encodeURIComponent(text)));
  },

  async testConnection() {
    const { githubOwner, githubRepo } = this.config;
    const res = await fetch(`${GITHUB_API}/repos/${githubOwner}/${githubRepo}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Connection failed (${res.status})`);
    }
    return res.json();
  },

  async getFile(path) {
    const { branch } = this.config;
    const res = await fetch(`${this.repoUrl(path)}?ref=${encodeURIComponent(branch)}`, {
      headers: this.headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GET ${path} failed (${res.status})`);
    }
    const data = await res.json();
    return {
      path: data.path,
      sha: data.sha,
      content: this.decodeContent(data),
    };
  },

  async putFile(path, textContent, sha, message) {
    const { branch } = this.config;
    const body = {
      message: message || `admin: update ${path}`,
      content: this.encodeContent(textContent),
      branch,
    };
    if (sha) body.sha = sha;

    const res = await fetch(this.repoUrl(path), {
      method: "PUT",
      headers: this.headers(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `PUT ${path} failed (${res.status})`);
    }
    return res.json();
  },

  async putBinaryFile(path, base64Content, sha, message) {
    const { branch } = this.config;
    const body = {
      message: message || `admin: upload ${path}`,
      content: base64Content,
      branch,
    };
    if (sha) body.sha = sha;

    const res = await fetch(this.repoUrl(path), {
      method: "PUT",
      headers: this.headers(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Upload ${path} failed (${res.status})`);
    }
    return res.json();
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  extFromFile(file) {
    const name = file.name || "";
    const dot = name.lastIndexOf(".");
    if (dot >= 0) return name.slice(dot).toLowerCase();
    if (file.type === "image/png") return ".png";
    if (file.type === "image/webp") return ".webp";
    if (file.type === "image/jpeg") return ".jpg";
    return ".jpg";
  },

  variantSuffix(label) {
    const l = String(label || "A").toUpperCase();
    if (l === "A") return "";
    return l.toLowerCase();
  },

  thumbImagePath(itemId, label, ext) {
    const { assetsDir } = this.config;
    const suffix = this.variantSuffix(label);
    return `${assetsDir}/${itemId}${suffix}${ext}`;
  },

  channelIconPath(itemId, ext) {
    const { channelIconsDir } = this.config;
    return `${channelIconsDir}/${itemId}${ext}`;
  },

  async loadPortfolio() {
    const { portfolioPath } = this.config;
    const file = await this.getFile(portfolioPath);
    if (!file) throw new Error("portfolio.json not found in repo");
    this.portfolioSha = file.sha;
    return JSON.parse(file.content);
  },

  async savePortfolio(data, message) {
    const { portfolioPath } = this.config;
    const text = `${JSON.stringify(data, null, 2)}\n`;
    const result = await this.putFile(portfolioPath, text, this.portfolioSha, message);
    this.portfolioSha = result.content?.sha || this.portfolioSha;
    return result;
  },

  async loadSite() {
    const { sitePath } = this.config;
    const file = await this.getFile(sitePath);
    if (!file) throw new Error("site.json not found in repo");
    this.siteSha = file.sha;
    return JSON.parse(file.content);
  },

  async saveSite(data, message) {
    const { sitePath } = this.config;
    const text = `${JSON.stringify(data, null, 2)}\n`;
    const result = await this.putFile(sitePath, text, this.siteSha, message);
    this.siteSha = result.content?.sha || this.siteSha;
    return result;
  },

  homepageWallImagePath(slot, ext) {
    const { homepageImagesDir } = this.config;
    const num = String(slot).padStart(2, "0");
    return `${homepageImagesDir}/wall-${num}${ext}`;
  },

  whyHireImagePath(index, ext) {
    const { homepageImagesDir } = this.config;
    return `${homepageImagesDir}/why-hire-${index + 1}${ext}`;
  },

  async uploadImage(path, file) {
    const base64 = await this.fileToBase64(file);
    let sha = null;
    try {
      const existing = await this.getFile(path);
      sha = existing?.sha || null;
    } catch {
      /* new file */
    }
    return this.putBinaryFile(path, base64, sha, `admin: upload ${path}`);
  },
};

window.GitHubStore = GitHubStore;
