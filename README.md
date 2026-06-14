# Kaalkine — Thumbnail Portfolio

A static portfolio site for **kaalkine**, inspired by [ike.design](https://ike.design). Built with plain HTML, CSS, and JavaScript — no build step required. Deploy to GitHub Pages at `https://kaalkine.github.io`.

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero, testimonials, process, FAQ |
| Portfolio | `portfolio.html` | Filterable thumbnail grid with lightbox |
| My Story | `story.html` | About / bio sections |
| Contact | `contact.html` | Formspree form + social links |

## Local preview

Because the site loads JSON via `fetch`, you need a local server (opening `index.html` directly in the browser will block JSON requests).

**Option A — Python:**
```bash
cd "e:\Projects\Thumbnail Portfolio"
python -m http.server 8000
```
Then open `http://localhost:8000`

**Option B — Node (npx):**
```bash
npx serve .
```

## Deploy to GitHub Pages

### 1. Create the repository

The repo **must** be named `kaalkine.github.io` under your **kaalkine** GitHub account for a user site.

```bash
cd "e:\Projects\Thumbnail Portfolio"
git init
git add .
git commit -m "Initial kaalkine portfolio site"
```

On GitHub, create a new repository named `kaalkine.github.io` (public, no README).

```bash
git branch -M main
git remote add origin https://github.com/kaalkine/kaalkine.github.io.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to **github.com/kaalkine/kaalkine.github.io** → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save — site will be live at `https://kaalkine.github.io` within 1–2 minutes

## Formspree setup

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form and copy your endpoint URL (e.g. `https://formspree.io/f/abcxyz`)
3. Open `data/site.json` and replace the placeholder:
   ```json
   "formspreeEndpoint": "https://formspree.io/f/YOUR_FORM_ID"
   ```
4. Push the change and test the contact form on your live site

## Content swap guide

| What to change | Where |
|----------------|-------|
| Brand name, taglines, social URLs | `data/site.json` |
| Testimonials, FAQ, story copy | `data/site.json` |
| Portfolio items (title, client, niche, date) | `data/portfolio.json` |
| Thumbnail images | `assets/portfolio/` — update `image` paths in `portfolio.json` |
| Colors, fonts, spacing | CSS variables at top of `css/styles.css` |
| Formspree endpoint | `data/site.json` → `formspreeEndpoint` |

### Adding a portfolio item

1. Drop your image (1280×720 recommended) into `assets/portfolio/`
2. Add an entry to `data/portfolio.json`:

```json
{
  "id": "thumb-17",
  "title": "Your Video Title",
  "client": "Channel Name",
  "views": "100k+ views",
  "niche": "Gaming",
  "date": "2026-04-01",
  "image": "assets/portfolio/your-image.jpg",
  "variants": [
    { "label": "A", "image": "assets/portfolio/your-image.jpg" },
    { "label": "B", "image": "assets/portfolio/your-image-b.jpg" }
  ]
}
```

## Project structure

```
├── index.html
├── portfolio.html
├── story.html
├── contact.html
├── css/styles.css
├── js/
│   ├── main.js       # Nav, FAQ, carousel, page rendering
│   ├── portfolio.js  # Grid, filters, lightbox
│   └── contact.js    # Formspree submit
├── data/
│   ├── site.json
│   └── portfolio.json
└── assets/portfolio/  # Thumbnail images
```

## License

Your content, your rights. Site template built for kaalkine's personal use.
