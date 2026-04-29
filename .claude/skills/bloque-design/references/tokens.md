# Tokens — Color, Type, Spacing

Exact values for every token in the Bloque design system. Values come from `.impeccable.md` and `bloque.app` production.

## Color

### Surfaces

| Token | Value | Role |
|-------|-------|------|
| **Background** | `#0d0c17` | Canonical page canvas. Cool dark purple-black — *not* pure black, *not* navy, *not* neutral gray. |
| **Card / surface** | Subtle purple-tinted variation (e.g. `bg-card/40`, `bg-surface/80`) | Every surface carries the purple undertone. Never pure black. Never neutral gray. |
| **Elevated surface** | Slightly lighter purple-tint, with `border/60` | Modals, floating panels, code windows. |

### Text

| Token | Value | Role |
|-------|-------|------|
| **Foreground** | Near-pure white (`#ffffff` or `hsl(0 0% 98%)`) | Primary headings, emphasized copy. |
| **Muted foreground** | Muted purple-gray | Body copy, descriptions, subtitles. |
| **Muted foreground / 70** | Lower alpha | Eyebrow labels, metadata. |
| **Muted foreground / 60** | Lower alpha | Chapter markers, micro-metadata. |

### Accent

| Token | Value | Role |
|-------|-------|------|
| **Accent (violet)** | `#a78bfa` | The Bloque accent. Active states, primary CTA, italicized accent word per headline, dot before eyebrows. |
| **Accent / 75** | `rgba(167,139,250,0.75)` | Syntax highlighting, softer accent. |
| **Accent / 25** | `rgba(167,139,250,0.25)` | Icon container borders. |
| **Accent / [0.06]** | `rgba(167,139,250,0.06)` | Icon container fill, subtle tinted surface. |

### Code syntax palette (monospace blocks)

| Role | Value |
|------|-------|
| Keywords / identifiers | `accent/75` |
| Strings | `emerald-400/80` |
| Numbers | `orange-400/75` |
| Punctuation / operators | Muted tones |

### Ambient effects

| Token | Value | Role |
|-------|-------|------|
| **Ambient violet glow** | Large radial gradient, `rgba(167,139,250,0.07)`, heavy blur | Behind hero sections, high-moment surfaces. Depth without noise. |
| **Hairline divider** | `bg-gradient-to-r from-transparent via-border to-transparent` | 16–24px fade, never a full-width line. |

## Typography — three voices

### 1. Display (compressed headings)

- Family: compressed sans-serif display (e.g. Söhne Breit, Inter Display, or similar)
- Weight: 600–700
- Tracking: `-0.025em` to `-0.035em` (aggressive negative, scales with size)
- Leading: `0.95–1.1` (tight)
- Italic treatment: **reserved for the one accent word per beat** — e.g. *last*, *you*, *your own*. Italic word usually carries the accent color.
- Size scale (hero → small):
  - Hero: `clamp(2.75rem, 5vw, 5.25rem)` / 44–84px
  - Section: `clamp(2rem, 3.5vw, 3.5rem)` / 32–56px
  - Card title: `0.9375rem` / 15px weight-semibold, tracking `-0.01em`

### 2. Body sans

- Family: clean sans-serif (system / Inter / Geist)
- Weight: 400 (regular) or 500 (medium) for slight emphasis
- Tracking: normal
- Leading: `1.65–1.7` (generous for readability)
- Color: muted foreground
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
  - Color: `text-muted-foreground/60` or `/70`
  - Often paired with an accent dot to the left: `inline-block h-1.5 w-1.5 rounded-full bg-accent`

## Spacing

- Max content width:
  - Dense landing sections: up to **1100px**
  - Long-form / manifesto: **680px** (readable measure)
  - Slides: **1920×1080** or **1280×720** canvas, with ~100–120px outer margins
- Section rhythm: generous top/bottom padding (96–160px desktop), narrower on mobile (48–64px)
- Card padding: `p-5` (20px) default, `p-6` (24px) for featured
- Inline element gaps: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- Eyebrow → headline gap: `gap-6` or `mb-4`
- Headline → body gap: `mb-4` or `mb-6`

## Radius

| Token | Value | Use |
|-------|-------|-----|
| Small | `rounded-md` / 6px | Tight inline badges, input corners |
| Card | `rounded-xl` / 12px | Standard card, code window, CTA |
| Large | `rounded-2xl` / 16px | Hero card, featured container |
| Full pill | `rounded-full` | Tag pills, accent dots, avatars |

## Borders

- Standard: `border border-border/60` — dim, purple-tinted, ~60% alpha
- Strong: `border-border` — full opacity, used rarely
- Accent ring: `border border-accent/25` + `bg-accent/[0.06]` for icon wells

## Depth / elevation

Bloque depth is quiet. No heavy drop shadows.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, maybe a border | Default cards, text blocks |
| Ambient | Large soft radial glow behind element | Hero sections, pivotal moments |
| Elevated | Subtle inner shadow or brighter border | Hovered cards, active states |

Never use stock drop-shadows (`shadow-lg` in its default form reads generic). If you need depth, use the ambient violet glow or a tighter border.
