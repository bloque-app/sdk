# Landings

Applying Bloque to marketing pages and product pages. The reference surface — most other mediums derive from how landings are built.

## Canvas

- Full-bleed `#0d0c17` background
- Max content width: **1100px** for dense sections, **1280px** with inner padding for feature grids
- Horizontal padding: `px-6` mobile, `px-8` tablet, `px-12` desktop
- Vertical rhythm: 96–160px between sections, tightening to 48–80px on mobile

## Page structure (typical)

1. **Sticky nav** — `bg-background/80 backdrop-blur`, logo + thin links + CTA right
2. **Hero** — ambient violet glow, compressed display headline with italic accent word, lede, primary CTA, optional secondary ghost
3. **Proof / trust strip** — small eyebrow + logo wall or metric row, subtle
4. **Sections (3–6)** — each prefaced by an eyebrow + chapter number, with dense supporting material (code snippets, diagrams, product shots)
5. **"The form IS the product"** moment — an interactive / animated element that *feels* like using Bloque (qualification flow, SDK demo, card issuer)
6. **FAQ / objection block** — dense, answers the skeptical CFO and the skeptical engineer
7. **Final CTA** — dark section with ambient glow restated, one big headline, one CTA
8. **Footer** — mono link grid, minimal

## Hero anatomy

```
        [●] CHAPTER 01

        Finance is the last frontier.
        One sentence opens the accounts, lights up the rails,
        issues the cards, writes the policies.

        [  Start building  →  ]   [ Read the manifesto ]

                  ·················
                  (ambient violet glow)
```

- Eyebrow: mono uppercase, tracked, muted, with accent dot
- Headline: `clamp(2.75rem, 5vw, 5.25rem)`, weight 700, tracking `-0.035em`, leading `0.95`, italic accent word in violet
- Lede: `1rem–1.125rem` muted foreground, max-width 52ch, tight to headline (16–24px gap)
- Buttons: primary violet + ghost. Gap 12px. Height 44px.
- Ambient glow: radial, centered top, `rgba(167,139,250,0.07)`

## Section rhythm

Each section opens the same way:

```
[●] CHAPTER 02

Density signals competence.
```

- Eyebrow (mono, muted, accent dot)
- Chapter number (dim scaffolding)
- Headline (display, tight tracking, one italic accent word)
- Lede (optional)
- Body content (cards / code / product shot)

This repetition is a feature. The page reads as chapters in a book, not tiles in a dashboard.

## Section content patterns

### Three-up feature cards
- 3-column grid on desktop, 2-column tablet, stacked mobile
- Each card follows the icon-well pattern from `components.md`
- Gap: 16–24px
- Don't force symmetry — one card can span 2 columns if the content demands it

### Code + copy split
- 2-column layout, 50/50 or 40/60
- Left: copy — eyebrow, headline, lede, bullet list of capabilities
- Right: window-chrome code snippet
- Bullets use mono labels + sans body descriptions

### Single-focus moment
- Full-width container, narrower content (max 720px centered)
- One oversized product shot or diagram
- Single line of copy below, muted foreground, center-aligned

### Metric row
- 4–6 metrics horizontally on desktop, 2×3 grid on mobile
- Each: big display number + mono eyebrow label
- Thin vertical dividers between (gradient hairlines, 24px tall)

## CTAs — landing-specific rules

- **One primary CTA per viewport.** If the hero has a violet CTA, no other section on screen can have one. Use ghosts.
- **Final CTA section** breaks the rule — it's its own viewport, so it gets the accent fill.
- Secondary CTAs (read the docs, view the manifesto) are always ghost/border-only.

## The qualification / demo flow

The live interactive moment. Treat it as a product surface, not a form:

- Dark card container, `rounded-2xl border border-border/60 bg-card/40`, `p-8`
- Inputs styled as the product would render them
- Progressive disclosure — one question visible at a time, prior questions summarized above
- Transitions: smooth, 200ms, no bounce
- Final step shows a "here's what we'd build for you" summary rendered as real-looking product output (pockets, cards, policies listed)

Never use generic HubSpot-style multi-field form. The form IS the product.

## Imagery

- Product screenshots: wrap in the window-chrome container (border + subtle tint)
- Never stock photography
- Diagrams: line-based, 1.5px stroke, muted foreground, accent used for active path only
- If you need illustration, prefer data visualizations (flow diagrams, topology maps) over decorative art

## Mobile

- Hero headline scales down proportionally — maintain the tracking ratio
- Navigation collapses to a hamburger, CTA persists in the header
- 3-column grids → stacked
- Sticky final CTA bar on long scrolls (optional)
- Ambient glow reduces intensity (smaller radius) — the effect is subtler on small viewports

## Reviewing a landing — five checks

1. Can you count the violet elements per viewport? ≤3?
2. Does every section open with eyebrow + chapter number + display headline?
3. Is there exactly one primary CTA visible at any scroll position (final CTA aside)?
4. Does the page have a "form IS the product" moment, or is it all static copy?
5. Would Linear ship this?

If any answer is no, revise before shipping.
