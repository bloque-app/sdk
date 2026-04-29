# Slides, Decks, Presentations (Light)

Applying Bloque light-mode to decks for bright rooms, training decks, printable handouts, investor decks that print. Dark decks are canonical; reach for light when the room is bright, the export prints, or the audience expects editorial formality.

## Canvas

- Aspect: **16:9** default (1920×1080 or 1280×720). Use 16:10 only if export target requires.
- Background: **`#faf9fc`** every slide. Never lighten further, never warm it toward cream.
- Outer margins: ~100–120px top/bottom, ~140–160px left/right on 1920×1080. Content sits inside the frame.

## Slide structure — the Bloque grid (same scaffold as dark)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [●] SECTION 01          ···ambient glow···          │
│                                                      │
│  Finance is the last frontier.                       │
│  Subtitle supporting the headline, tight.            │
│                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐                 │
│  │ card   │  │ card   │  │ card   │                 │
│  └────────┘  └────────┘  └────────┘                 │
│                                                      │
│                                                      │
│  bloque.app                             03 / 18      │
└──────────────────────────────────────────────────────┘
```

- **Top-left**: eyebrow (`#7c3aed` dot + `#8b88a0` mono section label)
- **Upper-middle**: display headline, one italic `#7c3aed` accent word
- **Middle**: body content — cards, chart, code, screenshot, or body paragraph
- **Bottom-left**: small mono `bloque.app`, `#8b88a0`
- **Bottom-right**: slide number `XX / YY`, mono, `#a8a5ba`

## Slide types (all mirror the dark deck, light tokens)

### 1. Title slide
- Ambient violet glow centered (`rgba(167,139,250,0.18)`)
- Eyebrow: project codename or deck title
- Headline: deck name with one italic `#7c3aed` accent word
- Sub-line: speaker / audience / date (mono, `#8b88a0`)
- No other content

### 2. Section divider
- Very sparse
- Eyebrow: `SECTION 02 — 03`
- Large chapter number (`02`) in display sans, `#a8a5ba` (~30% effective opacity)
- Section title underneath, `#0d0c17`

### 3. Statement slide (headline-only)
- Used for pivotal moments — *"Stop waiting for the bank."*
- Display headline occupies middle vertical third
- Left-aligned, max 2 lines, `#0d0c17`
- No supporting content
- Ambient glow optional
- **Variant**: this is a prime candidate for an **inverted dark slide** — full `#0d0c17` canvas for maximum impact. Limit to 1–2 inverted statement slides per deck.

### 4. Three-up slide
- 3 cards in a row, equal width, `bg-[#f2f0f7]` + `border-[rgba(13,12,23,0.10)]`
- Each card: icon well (soft-violet tint) + title + 1-line description
- Eyebrow + headline above

### 5. Code / product slide
- Window-chrome code snippet or product screenshot on right (55–60% of canvas)
- Code windows: prefer **inverted dark** (`bg-[#0d0c17]` + dark-mode syntax) for high contrast against the light canvas — this is one of the signature light-deck moves
- Copy on left: eyebrow, small headline, 3–4 bullets
- Bullets: mono labels + sans descriptions

### 6. Metric slide
- 3–5 big metric blocks horizontally
- Display number in `#0d0c17`, mono eyebrow label in `#8b88a0`
- Gradient hairline dividers between

### 7. Quote / testimonial
- Quote in display sans, weight 500, NOT italic
- One word can be italic `#7c3aed` if it's the thesis word
- Attribution: mono, `#8b88a0`, below-right

### 8. Comparison slide
- Two columns: "Before" and "With Bloque"
- Left: neutral cards, `#5a5770` text, `border-[rgba(13,12,23,0.10)]`
- Right: accent-tinted cards (`bg-[rgba(167,139,250,0.14)]`), `#7c3aed` accent dot before each row
- Avoid "red X / green ✓" trope

### 9. Flow / diagram
- Line-based nodes and edges, 1.5–1.75px strokes
- Inactive nodes: `border-[rgba(13,12,23,0.18)]`, `#5a5770` text
- Active / highlighted path: `#7c3aed`, 1–2 nodes max
- No shaded fills

### 10. Final CTA
- **Inverted dark slide** — full `#0d0c17` canvas with dark-mode tokens
- Ambient glow restated (dark-mode 0.07 alpha)
- Single headline: *"Build your financial stack."*
- One primary CTA (violet `#a78bfa` fill since we're on dark)
- Contact / handle / link in mono below

The deck ends in the brand's dark home — mirrors the landing's inverted final CTA.

## Typography at presentation scale (same as dark)

| Role | Size (on 1920×1080) |
|------|---------------------|
| Title-slide headline | 80–120px |
| Section headline | 56–72px |
| Body paragraph | 20–24px |
| Card title | 20–24px |
| Card body | 16–18px |
| Eyebrow / label | 12–14px |
| Slide number / footer | 11–12px |

Tracking still scales: `-0.035em` at 120px, `-0.025em` at 56px, normal at 16px.

## Density on slides (same as dark)

- Title / section-divider slides: 1 idea
- Content slides: 1 headline + 3–5 supporting pieces
- Never a slide with 7+ bullet points

## Motion (if the format supports it)

- Hard cuts between slides. No fades, no whips.
- On-slide reveals: fade-in with 8–12px upward translate, 250ms, staggered 60–80ms
- Never bounce, never rotate, never 3D

## Exporting to PDF

- Embed fonts
- **Light-specific**: check ambient-glow gradients render cleanly — low-alpha purple on light canvas can banding on some PDF engines. Rasterize the glow layer at 2× if it bands.
- Dim text (`#8b88a0` at 10–12px) must survive export — verify slide numbers are legible
- Hyperlinks: keep `#7c3aed` underlined

## Figma / Keynote / Pitch setup

- Master slides: title, section divider, content-with-eyebrow, code-split, metric-row, final-CTA (inverted), statement-inverted
- Color styles: `bg-light`, `surface-light`, `elevated-light`, `fg-light`, `muted-light`, `accent-deep`, `accent-soft`, `border-light`, plus the full dark-mode set for inverted slides
- Text styles: `display-xl`, `display-lg`, `display-md`, `body-lg`, `body`, `eyebrow`, `mono-label`
- Reuse — never restyle a headline slide-by-slide

## When the room is genuinely bright (projector, daylight)

- Increase body text size by one step (24 → 28)
- Darken muted foreground from `#5a5770` to `#3f3d52` — projected light washes out subtle grays
- Bump deep-accent italic words slightly bolder (weight 600 instead of 500 italic)
- Don't use the soft-violet `#a78bfa` for any text even in non-text decorative roles — it can disappear against a washed-out projection

## Reviewing a light deck — five checks

1. Does every slide open with the same scaffold?
2. Are there ≤3 deep-violet (`#7c3aed`) elements on any single slide?
3. Is there exactly one italic accent word per headline slide?
4. Does the deck have at least one inverted-dark moment (statement slide or final CTA) to signature the brand?
5. If you flip through quickly, does it feel like the same deck as the dark version, just inverted?

If any answer is no, revise before the meeting.
