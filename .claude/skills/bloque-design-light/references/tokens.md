# Tokens — Color, Type, Spacing (Light)

Exact values for every token in the Bloque **light** design system. Derived from the dark system (`#0d0c17` canvas, `#a78bfa` accent) with palette inversion and contrast correction so both themes read as the same brand.

## Color

### Surfaces

| Token | Value | Role |
|-------|-------|------|
| **Background** | `#faf9fc` | Canonical page canvas — warm purple-tinted near-white. *Not* pure white, *not* cream, *not* neutral gray. |
| **Surface (card)** | `#f2f0f7` | Standard card background. The subtle step down from canvas that carries the purple undertone. |
| **Elevated surface** | `#ebe8f1` | Modals, floating panels, code windows, featured cards. Slightly deeper than surface. |
| **Inverted surface** | `#0d0c17` | When a single section needs to go dark (e.g. final CTA, hero quote) — this mirrors the dark-mode canvas exactly. |

### Text

| Token | Value | Role |
|-------|-------|------|
| **Foreground** | `#0d0c17` | Primary headings, emphasized copy. Same hex as dark-mode canvas — the brand's defining purple-black. |
| **Muted foreground** | `#5a5770` | Body copy, descriptions, subtitles. |
| **Muted foreground / subtle** | `#8b88a0` | Eyebrow labels, metadata, less-critical body. |
| **Muted foreground / dim** | `#a8a5ba` | Chapter markers, micro-metadata, scaffolding numbers. |

### Accent

| Token | Value | Role |
|-------|-------|------|
| **Accent (deep)** | `#7c3aed` | Primary accent on light. CTAs, active states, the italicized accent word, link color, the dot before eyebrows. Carries the accent duty anywhere contrast matters. |
| **Accent (soft)** | `#a78bfa` | The same violet as dark-mode accent. On light, it's reserved for tint surfaces, ambient glows, icon well fills — decorative moments that don't require 4.5:1 text contrast. |
| **Accent / 75** | `rgba(124,58,237,0.75)` | Syntax highlighting, softer accent text. |
| **Accent tint surface** | `rgba(167,139,250,0.14)` | Icon containers, tinted pills, subtle accent fills. |
| **Accent tint border** | `rgba(124,58,237,0.25)` | Icon well borders, accent-bordered elements. |

### Code syntax palette (monospace blocks)

Light-mode syntax colors. Shifted deeper than dark-mode counterparts so they hold on the light canvas.

| Role | Value |
|------|-------|
| Keywords / identifiers | `#7c3aed` (accent deep) |
| Strings | `#047857` (emerald-700) |
| Numbers | `#c2410c` (orange-700) |
| Punctuation / operators | `#8b88a0` (muted subtle) |

### Ambient effects

| Token | Value | Role |
|-------|-------|------|
| **Ambient violet glow** | Large radial gradient, `rgba(167,139,250,0.18)` at center fading to transparent, heavy blur | Behind hero sections, high-moment surfaces. Alpha is higher than dark (0.07 → 0.18) because light canvases swallow subtle glows. |
| **Hairline divider** | `bg-gradient-to-r from-transparent via-[rgba(13,12,23,0.10)] to-transparent` | 16–24px fade, never a full-width line. |

## Typography — three voices (identical to dark)

Typography rules are shared with the dark system. Only the color tokens change.

### 1. Display (compressed headings)

- Family: compressed sans-serif display (e.g. Söhne Breit, Inter Display, or similar)
- Weight: 600–700
- Tracking: `-0.025em` to `-0.035em` (aggressive negative, scales with size)
- Leading: `0.95–1.1` (tight)
- Italic treatment: **reserved for the one accent word per beat** — e.g. *last*, *you*, *your own*. Italic word takes the **deep accent** `#7c3aed`.
- Size scale (hero → small):
  - Hero: `clamp(2.75rem, 5vw, 5.25rem)` / 44–84px
  - Section: `clamp(2rem, 3.5vw, 3.5rem)` / 32–56px
  - Card title: `0.9375rem` / 15px weight-semibold, tracking `-0.01em`
- Color: `#0d0c17` (foreground)

### 2. Body sans

- Family: clean sans-serif (system / Inter / Geist)
- Weight: 400 (regular) or 500 (medium) for slight emphasis
- Tracking: normal
- Leading: `1.65–1.7` (generous for readability)
- Color: `#5a5770` (muted foreground)
- Size scale:
  - Lead paragraph: `1rem–1.125rem` / 16–18px
  - Body: `0.875rem–1rem` / 14–16px
  - Card body: `0.8125rem` / 13px, leading `1.6`

### 3. Monospace

- Family: monospace (Geist Mono, Berkeley Mono, JetBrains Mono, IBM Plex Mono)
- Used for: code blocks, command palettes, chapter markers, eyebrows, section labels, metadata
- Eyebrow / label pattern:
  - Size: `10–11px` / `text-[10px]`
  - Transform: `uppercase`
  - Tracking: `0.22em–0.3em`
  - Color: `#8b88a0` (muted subtle) — step dimmer if the surface is already a card
  - Often paired with an accent dot to the left: `inline-block h-1.5 w-1.5 rounded-full bg-[#7c3aed]`

## Spacing (identical to dark)

- Max content width:
  - Dense landing sections: up to **1100px**
  - Long-form / manifesto: **680px** (readable measure)
  - Slides: **1920×1080** or **1280×720** canvas, with ~100–120px outer margins
- Section rhythm: generous top/bottom padding (96–160px desktop), narrower on mobile (48–64px)
- Card padding: `p-5` (20px) default, `p-6` (24px) for featured
- Inline element gaps: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- Eyebrow → headline gap: `gap-6` or `mb-4`
- Headline → body gap: `mb-4` or `mb-6`

## Radius (identical to dark)

| Token | Value | Use |
|-------|-------|-----|
| Small | `rounded-md` / 6px | Tight inline badges, input corners |
| Card | `rounded-xl` / 12px | Standard card, code window, CTA |
| Large | `rounded-2xl` / 16px | Hero card, featured container |
| Full pill | `rounded-full` | Tag pills, accent dots, avatars |

## Borders

- Standard: `border border-[rgba(13,12,23,0.10)]` — dim, purple-tinted, ~10% alpha
- Strong: `border border-[rgba(13,12,23,0.18)]` — used sparingly for emphasis and active states
- Accent ring: `border border-[rgba(124,58,237,0.25)]` + `bg-[rgba(167,139,250,0.14)]` for icon wells

Light-mode borders use the foreground color at low alpha (not the background darkened) so they stay perceptually consistent with dark-mode purple-tinted borders.

## Depth / elevation

Light Bloque depth is still quiet — no heavy drop shadows. Contrast comes from surface-tone steps (`bg → surface → elevated`) more than from shadow.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, maybe a border | Default cards, text blocks |
| Ambient | Large soft radial glow behind element | Hero sections, pivotal moments |
| Elevated | Very subtle shadow: `0 1px 2px rgba(13,12,23,0.04), 0 8px 24px rgba(13,12,23,0.06)` | Hovered cards, active states, floating panels |

Never use stock drop-shadows (`shadow-lg`, `shadow-2xl`). If you need depth, step the surface tone or apply the ambient violet glow.

## Contrast notes (light-specific)

- Body text at `#5a5770` on `#faf9fc` → ~7.4:1 (AAA)
- Foreground `#0d0c17` on `#faf9fc` → ~17:1 (AAA)
- Accent `#7c3aed` on `#faf9fc` → ~6.2:1 (AA-large, close to AAA-normal) — safe for headline italics, CTAs, and links
- Accent `#a78bfa` on `#faf9fc` → ~2.5:1 — **not** safe for text. Use it only for tint fills, glows, and icon wells. Never set body copy or headings in `#a78bfa` on light.

If you ever need the soft violet on text, place it on an inverted section (`#0d0c17` surface) — this is the one case where the dark palette reappears mid-document.
