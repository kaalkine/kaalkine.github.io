# Kaalkine Design System

## Color

| Token | Hex | Use |
|-------|-----|-----|
| `--canvas` | `#121117` | Page background |
| `--surface` | `#1a1922` | Cards, elevated panels |
| `--surface-raised` | `#22212c` | Inputs, hover states |
| `--accent` | `#305CDE` | Headlines, CTAs, process band, footer CTA |
| `--accent-secondary` | `#6E8DE8` | Ghost buttons, UI chrome, highlights |
| `--accent-hover` | `#3d6ae8` | Primary button hover |
| `--on-accent` | `#121117` | Text on blue bands |
| `--ink` | `#f5f5f7` | Primary text |
| `--ink-muted` | `#b8b8c4` | Body secondary |
| `--border` | `#2a2938` | Dividers |

Strategy: **Committed** — blue accent at full strength on hero headlines, process band, and footer CTA.

## Typography

- **Display:** Alumni Sans 800–900 — headlines, process labels
- **Pinstripe:** Alumni Sans Pinstripe — logo only
- **Body:** Albert Sans 600–700 — paragraphs, nav, UI

## Homepage layout (ike.design-inspired)

1. Hero — 2-column (copy + illustration)
2. Testimonials — 3-card row
3. Thumbnail wall — dense grid with value/stat inserts
4. Process — full-width blue band
5. Why hire — 2×2 alternating text/image grid
6. FAQ — accordion with + icons
7. Footer CTA — full-width blue band

## Motion

- Hero illustration: gentle float (4s), disabled with `prefers-reduced-motion`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
