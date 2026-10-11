---
name: AI Finder — Bento Atlas
colors:
  canvas: '#E9ECEF'
  surface: '#FFFFFF'
  surface-sunken: '#F1F3F5'
  surface-track: '#DDE1E6'
  line: '#DDE1E6'
  line-strong: '#C4CAD2'
  ink: '#101418'
  ink-2: '#454D5A'
  ink-3: '#5B6370'
  accent: '#0F3A2C'
  accent-hover: '#155240'
  accent-soft: '#DCF6EA'
  mint: '#3EE0A0'
  night: '#101418'
  night-body: '#CDD3DA'
  night-muted: '#9AA3AE'
  forest-text: '#E7F6EF'
  forest-muted: '#A9D4C2'
  error: '#B42318'
  error-soft: '#FCECEA'
typography:
  display:
    fontFamily: Unbounded
    fontSize: clamp(2.25rem, 1.3rem + 3.2vw, 3.875rem)
    fontWeight: '600'
    lineHeight: '1.06'
    letterSpacing: -0.035em
  page-title:
    fontFamily: Unbounded
    fontSize: clamp(2.25rem, 1.5rem + 2.8vw, 3.75rem)
    fontWeight: '600'
    lineHeight: '1.04'
    letterSpacing: -0.04em
  heading:
    fontFamily: Unbounded
    fontSize: clamp(1.75rem, 1.3rem + 1.4vw, 2.5rem)
    fontWeight: '600'
    letterSpacing: -0.03em
  title:
    fontFamily: Unbounded
    fontSize: 1.1875rem
    fontWeight: '600'
    letterSpacing: -0.02em
  body:
    fontFamily: Onest
    fontSize: 1rem
    lineHeight: '1.6'
  data:
    fontFamily: Geist Mono
    fontSize: 0.8125rem
rounded:
  xs: 8px
  sm: 12px
  md: 18px
  lg: 28px
  xl: 36px
  full: 9999px
spacing:
  unit: 4px
  bento-gap: 14px
  gutter: clamp(16px, 4vw, 40px)
  container: 1280px
---

# Design System: AI Finder — "Bento Atlas"

Replaces "Quiet Index 2" (warm paper + ember). The old look read as the default
LLM palette; this one is built from a cool silver canvas, white and ink tiles and
one forest accent with a mint signal colour.

## 1. Atmosphere

A catalogue laid out as a bento board. Every block of information is a tile with
one job; tiles differ in weight (size, white / forest / ink) so the page has
rhythm without decoration. Typography carries the identity: the wide Unbounded
for headings and names, Onest for reading, Geist Mono only for machine data.

**Taste dials:** Variance 7 (asymmetric bento, offset tile sizes), Motion 7
(load cascade, springs on hover, one marquee), Density 4.

## 2. Colour

- **Canvas** `#E9ECEF` (cool silver) behind everything. **Surface** `#FFFFFF` tiles, **Sunken** `#F1F3F5` inner fills (search field, category tiles, tags).
- **Ink** `#101418` text and ink tiles (recent launches, every 2nd and 6th catalogue card, footer).
- **Forest** `#0F3A2C`: the only accent. Primary buttons, active chips, the toggle "on" state, the live-index tile, focus rings, the ratio ring.
- **Mint** `#3EE0A0`: signal colour, used only on forest or ink (button labels, big numbers, the hovered visit button, the "live" dot). Mint on forest is 7.5:1.
- Secondary text `#5B6370` is 6.1:1 on white and 5.1:1 on the canvas. On ink tiles body text is `#CDD3DA`, muted `#9AA3AE` (7:1).
- No purple/blue gradients, no pure black, no second accent. Shadows are tinted ink/forest.

## 3. Typography

- **Unbounded Variable** (self-hosted from `src/assets/fonts`, Latin + Cyrillic): h1–h4, card and row names, buttons, big numbers.
- **Onest Variable**: body, controls, labels.
- **Geist Mono Variable**: domains, dates, DR, counts, code. `tabular-nums`.
- Sentence case everywhere. No eyebrows above section headings, no section numbers.

## 4. Components

- **Header:** floating glass pill, centred, logo inside it. Active link is an ink pill. Mobile: the pill spans the width, a round ink button morphs into a cross and opens a tile menu whose links slide up in sequence.
- **Hero bento (home):** main white tile (headline, lead, search) 8/12 across two rows; forest "live index" tile; white tile with the share of genuine AI products as a ring (computed from the two API totals); "Browse by task" tile with 8 category shortcuts (same API values as the filters); ink "Went live recently" tile with a marquee of the newest launches from the API (pauses on hover/focus, opens the detail modal).
- **Search:** sunken pill inside the white tile, forest focus ring with a mint halo. The "Search" button applies the query without waiting for the debounce and scrolls to the results.
- **Catalogue toolbar:** Unbounded heading + live count, toggle and sort on the right, category chips in a silver track below. Active chip: forest with mint text.
- **Cards:** 36px radius, 26px padding, a 56px tinted letter tile (the real favicon fades in on white), name in Unbounded, mono domain, 3-line summary, pill tags, DR bars + date in the footer, round visit button top right. Every 2nd and 6th card of each six is an ink tile. Hover: lift 6px with a slight tilt, the icon tile springs, the visit button fills with mint.
- **Modal:** native `<dialog>`, white 36px tile, bottom sheet under 560px (unchanged behaviour).
- **New AI:** sticky date column with a forest-to-mint rail; rows are white tiles.
- **About:** 12-column bento of forest, white and ink tiles; API panel with an ink code block.
- **Footer:** ink tile inset in the container.

## 5. Layout

- Container 1280px, gutter `clamp(16px, 4vw, 40px)`, bento gap 14px (10px on phones).
- Breakpoints: 1080px (hero tiles reflow, numbers share a row), 720px (burger menu), 560px (single column, compact type).
- No horizontal page scroll at any width.

## 6. Motion

- Load: tiles and cards rise 28–36px, scale from 0.985 and fade in (Anime.js, `outQuart`, staggered, waits for all three font families).
- Catalogue items reveal as they scroll in (IntersectionObserver), only new items on "Load more".
- Hover: springs (`cubic-bezier(.34,1.56,.64,1)`) on icon tiles, category tiles, toggle knob and language thumb; drawer easing (`cubic-bezier(.32,.72,0,1)`) on card lift.
- Ambient: one slow mint light drifting in white header tiles, the "live" ripple, the recent-launches marquee.
- Only `transform`, `opacity` and SVG stroke are animated. `prefers-reduced-motion` stops everything; the marquee becomes a scrollable strip.

## 7. States

| State | Treatment |
|---|---|
| Loading | Skeleton tiles shaped like cards / rows, shimmer; pill skeletons in the marquee |
| Error | Soft red tile, plain message, Retry; failed "Load more" shows inline text + Try again |
| Empty | White tile, forest glyph, the exact query in the title, Reset button |
| Focus | 2px canvas gap, 2px forest ring, 4px mint halo (keyboard only) |
