# Landings (Light)

Applying Bloque light-mode to marketing pages, docs portals, and print-style product pages. Light is the secondary surface — dark remains canonical. Use light when the context demands it (docs, editorial, print-bound landings, compare-themes demos).

## Canvas

- Full-bleed `#faf9fc` background
- Max content width: **1100px** for dense sections, **1280px** with inner padding for feature grids
- Horizontal padding: `px-6` mobile, `px-8` tablet, `px-12` desktop
- Vertical rhythm: 96–160px between sections, tightening to 48–80px on mobile

## Page structure (identical to dark)

1. **Sticky nav** — `bg-[#faf9fc]/80 backdrop-blur-md`, logo + thin links + CTA right
2. **Hero** — ambient violet glow (at 0.18 alpha), compressed display headline with italic accent word, lede, primary CTA, optional secondary ghost
3. **Proof / trust strip** — small eyebrow + logo wall or metric row
4. **Sections (3–6)** — each prefaced by eyebrow + chapter number, dense supporting material
5. **"The form IS the product"** moment — interactive / animated element
6. **FAQ / objection block** — dense, answers skeptical CFO and skeptical engineer
7. **Final CTA** — **inverted dark section** (`#0d0c17`) with dark-mode tokens, ambient glow restated, one big headline, one CTA
8. **Footer** — mono link grid, minimal

**Light-specific note**: the inverted final-CTA section is a deliberate brand signature — the page ends by reminding you that Bloque's home is dark. One inverted section per page maximum.

## Hero anatomy

```
        [●] CHAPTER 01

        Finance is the last frontier.
        One sentence opens the accounts, lights up the rails,
        issues the cards, writes the policies.

        [  Start building  →  ]   [ Read the manifesto ]

                  ·················
                  (ambient violet glow, 0.18 alpha)
```

- Eyebrow: mono uppercase, tracked, `#8b88a0`, with `#7c3aed` accent dot
- Headline: `clamp(2.75rem, 5vw, 5.25rem)`, weight 700, tracking `-0.035em`, leading `0.95`, color `#0d0c17`, italic accent word in `#7c3aed`
- Lede: `1rem–1.125rem`, color `#5a5770`, max-width 52ch
- Buttons: violet primary (`bg-[#7c3aed]` + white text) + ghost (`border-[rgba(13,12,23,0.18)]` + `#0d0c17` text). Gap 12px. Height 44px.
- Ambient glow: radial, centered top, `rgba(167,139,250,0.18)` (heavier than dark's 0.07 — light canvases need more)

## Section rhythm

```
[●] CHAPTER 02

Density signals competence.
```

- Eyebrow (mono, `#8b88a0`, `#7c3aed` dot)
- Chapter number in `#a8a5ba` (dim scaffolding)
- Headline (display, tight tracking, one italic `#7c3aed` accent word)
- Lede (optional)
- Body content

Same chapters-in-a-book feel as dark. The repetition is the point.

## Section content patterns

### Three-up feature cards
- 3-column grid desktop, 2-column tablet, stacked mobile
- Each card: `bg-[#f2f0f7]` + `border-[rgba(13,12,23,0.10)]`, follows the icon-well pattern from `components.md`
- Gap: 16–24px
- Don't force symmetry — one card can span 2 columns if content demands

### Code + copy split
- 2-column layout, 50/50 or 40/60
- Left: copy — eyebrow, headline, lede, bullet list
- Right: window-chrome code snippet — either a light code window (`bg-[#ebe8f1]`) or an **inverted dark code window** for a high-impact contrast moment. Light is the calmer default; inverted is the feature-hero treatment.

### Single-focus moment
- Full-width container, narrower content (max 720px centered)
- One oversized product shot or diagram
- Single line of copy below, `#5a5770`, center-aligned

### Metric row
- 4–6 metrics horizontally on desktop, 2×3 grid on mobile
- Each: big display number (`#0d0c17`, display sans, weight 600) + mono eyebrow label (`#8b88a0`)
- Thin vertical gradient-hairline dividers between, 24px tall

## CTAs — landing-specific rules

- **One primary (violet-filled) CTA per viewport.** If the hero has `bg-[#7c3aed]`, no other viewport section can.
- **Final CTA section** is the exception (and it's on an inverted `#0d0c17` surface anyway, using dark-mode accent).
- Secondary CTAs are always ghost/border-only (`border-[rgba(13,12,23,0.18)]`).

## The qualification / demo flow

The live interactive moment. Treat it as a product surface, not a form:

- Card container: `rounded-2xl border border-[rgba(13,12,23,0.10)] bg-[#f2f0f7]`, `p-8`
- Or, for hero feature-demo impact: **inverted** container with dark-mode tokens — the flow feels like the live product
- Inputs: `bg-[#ffffff]` (yes, pure white is legal *inside* inputs), `border-[rgba(13,12,23,0.18)]`, focus border `#7c3aed`, text `#0d0c17`
- Progressive disclosure — one question at a time, prior summarized above
- Transitions: 200ms, no bounce
- Final step shows a product-output summary

Never a generic HubSpot-style form.

## Imagery

- Product screenshots: wrap in window-chrome — either light or inverted
- Never stock photography
- Diagrams: line-based, 1.5px stroke, `#5a5770` for lines, `#7c3aed` for the active/highlighted path
- Prefer data visualizations over decorative art

## Mobile

- Hero scales down proportionally, maintaining tracking ratio
- Navigation collapses to hamburger, CTA persists
- 3-column → stacked
- Sticky final CTA bar on long scrolls (optional) — keep it light-themed to match the page
- Ambient glow reduces intensity on small viewports

## Reviewing a light landing — five checks

1. Can you count the deep-violet (`#7c3aed`) elements per viewport? ≤3?
2. Does every section open with eyebrow + chapter number + display headline?
3. Is there exactly one primary CTA visible at any scroll position (final CTA aside)?
4. Does the page end on an **inverted dark final-CTA**? (Signature brand move for light pages.)
5. Placed side-by-side with a dark version of the same page, does it clearly read as the same brand?

If any answer is no, revise before shipping.
