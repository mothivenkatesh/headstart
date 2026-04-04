# Headstart — Design Token System

Based on analysis of Bluesky's ALF (Application Layout Framework) and observable patterns from bsky.app

## Design Principles

1. **One border color** — single divider color across the entire app
2. **No shadows on content** — shadows only on overlays (modals, dropdowns)
3. **3 font sizes** — small (13px), body (15px), heading (17px)
4. **Brand color only on actions** — everything else is grayscale
5. **4px spacing grid** — all spacing is multiples of 4px
6. **Hover = tinted circle** on icons, subtle bg on rows
7. **Two border-radius values** — rounded-lg (8px) for cards, rounded-full for avatars/pills

## Tokens

### Colors
- `--border`: #E5E5E5 (single divider color everywhere)
- `--bg-primary`: #FFFFFF
- `--bg-secondary`: #F5F5F5 (right panel cards, input backgrounds)
- `--bg-hover`: rgba(0,0,0,0.03)
- `--text-primary`: #171717
- `--text-secondary`: #555555
- `--text-tertiary`: #888888
- `--brand`: #1A54F2

### Font Sizes
- `text-sm`: 13px — metadata, timestamps, labels
- `text-base`: 15px — body text, post content, names
- `text-lg`: 17px — titles, headings
- `text-xl`: 22px — page titles only

### Spacing (4px grid)
- 4, 8, 12, 16, 20, 24, 32, 40, 48

### Border Radius
- `rounded-lg`: 8px — cards, inputs, buttons
- `rounded-full`: 9999px — avatars, pills, icon buttons

### Shadows
- `shadow-sm`: 0 1px 2px rgba(0,0,0,0.05) — chat bubbles only
- `shadow-lg`: 0 4px 12px rgba(0,0,0,0.1) — dropdowns, modals only
- Everything else: no shadow

### Z-Index
- 10: sticky headers
- 20: dropdown menus
- 30: fixed header/bottom nav
- 50: modals/overlays

## Element-by-Element Spec

### Left Sidebar
- Width: 200px
- Background: transparent (inherits page bg)
- Nav items: inline-flex, rounded-full hover bg, gap-4 between icon (24px) and text (15px)
- Active: font-bold, no bg color change
- Hover: bg-hover on the pill only
- No borders between items

### Center Feed
- Width: 600px (desktop), full-width (mobile)
- Border-left and border-right: 1px solid var(--border)
- Sticky header: bg-white, border-bottom var(--border)
- Post cards: border-bottom var(--border), hover bg-hover
- No horizontal padding on dividers (full-width lines)

### Right Sidebar
- Width: 320px
- Cards: bg-white, border 1px solid var(--border), rounded-lg
- Internal dividers inside cards: same var(--border)
- Card padding: 16px
- Gap between cards: 16px

### Header
- Height: 60px
- bg-white, border-bottom var(--border)
- Search: bg-secondary when idle, bg-white + border when focused
- Icons: 22px, text-secondary, hover with tinted circle

### Modals/Dropdowns
- bg-white, border var(--border), rounded-lg
- shadow-lg only
- Backdrop: rgba(0,0,0,0.4)
