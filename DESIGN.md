# Kaalkine Design System

## Color

| Token | Hex | Use |
|-------|-----|-----|
| `--canvas` | `#121117` | Page background (near-black) |
| `--surface` | `#1a1922` | Cards, elevated panels |
| `--surface-raised` | `#22212c` | Inputs, hover states |
| `--accent` | `#305CDE` | Headlines, CTAs, process band, footer CTA |
| `--accent-secondary` | `#6E8DE8` | Ghost button borders, UI chrome |
| `--accent-hover` | `#3d6ae8` | Primary button hover |
| `--pop` | `#ffd21c` | Highlighter mark, views tags, subscriber chips, selection |
| `--candy` | `#ff5da2` | Confetti accents (quote marks, FAQ icons, doodles) |
| `--mint` | `#17c3a2` | Confetti accents |
| `--tangerine` | `#ff8a3d` | Confetti accents |
| `--on-accent` | `#121117` | Text on blue bands and yellow chips |
| `--ink` | `#f5f5f7` | Primary text |
| `--ink-muted` | `#b8b8c4` | Body secondary |
| `--border` | `#2a2938` | Dividers |

Strategy: **Committed + confetti** — near-black canvas, blue at full strength on the process band and footer CTA (subtle gradients for depth), `--accent-secondary` on headlines for contrast. One `--pop` yellow highlighter stripe per hero headline (`hero.highlight` in site.json). Candy/mint/tangerine appear only as small repeated accents (quote marks, FAQ plus icons), never as large fields.

## Typography

- **Display:** Alumni Sans 800–900 — headlines, process labels
- **Pinstripe:** Alumni Sans Pinstripe — logo only
- **Body:** Albert Sans 600–700 — paragraphs, nav, UI

## Homepage layout (ike.design-inspired)

1. Hero — 2-column (copy + illustration), ambient blue glow behind copy
2. Creator marquee — infinite "Trusted by" scroll of creator avatars + subscriber counts (pauses on hover, static wrap under reduced motion)
3. Testimonials — 3-card carousel
4. Thumbnail wall — dense grid with value/stat inserts
5. Process — full-width blue band
6. Why hire — 2×2 alternating text/image grid
7. FAQ — accordion with + icons
8. Footer CTA — full-width blue band

## Image loading

- `npm run build:thumb-sizes` generates AVIF/WebP variants plus LQIP placeholders; `scripts/build-lqip-css.mjs` combines them into `css/lqip.css` (`--lqip-<name>` vars) which index/portfolio pages link.
- Blur-up: `<picture>` shows the LQIP behind the image until the img load event adds `.loaded` (global listener in `js/utils.js`).
- First portfolio-grid row loads eagerly with `fetchpriority=high`; everything below stays lazy.

## Motion

- Hero illustration: gentle float, disabled with `prefers-reduced-motion`
- Hero highlighter mark: yellow stripe behind the key phrase (`hero.highlight`)
- Cards (process, testimonials, thumbs): hover lift with slight playful rotation
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
