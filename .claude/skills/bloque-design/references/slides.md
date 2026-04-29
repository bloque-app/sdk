# Slides, Decks, Presentations

Applying Bloque to pitch decks, investor decks, demo decks, internal reviews. Whether in Figma, Keynote, Pitch, Google Slides, or exported PDF — same rules, different canvas.

## Canvas

- Aspect: **16:9** default (1920×1080 or 1280×720). Use 16:10 only if the export target requires it.
- Background: **`#0d0c17`** every slide. Never lighten a slide "for variety" — visual consistency is the brand.
- Outer margins: ~100–120px top/bottom, ~140–160px left/right on a 1920×1080 canvas. Content sits inside this frame — it never touches the edge except for intentional full-bleed moments.

## Slide structure — the Bloque grid

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

Every slide has the same scaffold:

- **Top-left**: eyebrow (accent dot + mono section label), muted
- **Upper-middle**: display headline, one italic violet accent word
- **Middle**: body content — cards, chart, code, screenshot, or body paragraph
- **Bottom-left**: small mono `bloque.app` or project label, muted
- **Bottom-right**: slide number as `XX / YY`, mono, dim

This scaffold lets dense slides and sparse slides feel like the same deck.

## Slide types

### 1. Title slide
- Ambient violet glow centered
- Eyebrow: project codename or deck title
- Headline: deck name with one italic accent word
- Sub-line: speaker / audience / date (mono, muted)
- No other content

### 2. Section divider
- Very sparse
- Eyebrow: `SECTION 02 — 03`
- Large chapter number (`02`) in display sans, muted to ~30% opacity
- Section title underneath

### 3. Statement slide (headline-only)
- Used for pivotal moments — *"Stop waiting for the bank."*
- Display headline occupies the middle vertical third
- Left-aligned, max 2 lines
- No supporting content
- Ambient glow optional

### 4. Three-up slide
- 3 cards in a row, equal width
- Each card: icon well + title + 1-line description
- Eyebrow + headline above

### 5. Code / product slide
- Window-chrome code snippet or product screenshot on right (55–60% of canvas)
- Copy on left: eyebrow, small headline, 3–4 bullets
- Bullets use mono labels + sans descriptions

### 6. Metric slide
- 3–5 big metric blocks horizontally
- Large display number + small mono eyebrow label
- Thin gradient hairline dividers between

### 7. Quote / testimonial
- Quote in display sans, weight 500, NOT italic (italic is reserved for accent words)
- One word in the quote can be italic violet if it's the thesis word
- Attribution: mono, muted, below-right

### 8. Comparison slide
- Two columns: "Before" and "With Bloque"
- Left column: muted foreground, neutral borders
- Right column: accent-tinted cards, accent dot before each row
- Avoid the "red X / green ✓" trope — use subtle presence/absence instead

### 9. Flow / diagram
- Line-based nodes and edges, 1.5–1.75px strokes
- Inactive nodes: `border-border/60`, muted foreground text
- Active / highlighted path: accent color, 1–2 nodes max
- No shaded fills — keep it linear

### 10. Final CTA
- Full ambient glow
- Single headline: *"Build your financial stack."* (or similar)
- One primary CTA-looking element (button shape, or URL pill)
- Contact / handle / link in mono below

## Typography at presentation scale

Slides read from 10+ feet away. Sizes are bigger than landings:

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

## Density on slides

Presentations traditionally strip to one idea per slide. Bloque pushes back: **density signals competence** — but *within reason* for the presentation format.

- Title / section-divider slides: 1 idea
- Content slides: 1 headline + 3–5 supporting pieces (cards, bullets, code)
- Never a slide with 7+ bullet points — that's a document, export it separately

## Motion (if the format supports it)

- Slide transitions: hard cuts. No fades, no whip pans, no Keynote "magic move."
- On-slide reveals: simple fade-in with 8–12px upward translate, 250ms, staggered 60–80ms between items.
- Never bounce, never rotate, never 3D.

## Exporting to PDF

- Embed fonts — don't rasterize unless you have to
- Check contrast at 1× zoom — `text-muted-foreground/60` can read too dim on a projector
- Rasterize ambient glow gradients at 2× resolution to avoid banding
- Footer slide numbers must survive export — avoid tiny 10px type

## Figma / Keynote / Pitch setup

- Create master slides: title, section divider, content-with-eyebrow, code-split, metric-row, final-CTA
- Define color styles: `background`, `foreground`, `muted`, `accent`, `border`, `accent/glow`
- Define text styles: `display-xl`, `display-lg`, `display-md`, `body-lg`, `body`, `eyebrow`, `mono-label`
- Reuse — never restyle a headline slide-by-slide

## Reviewing a deck — five checks

1. Does every slide open with the same scaffold (eyebrow top-left, headline, footer)?
2. Are there ≤3 violet elements on any single slide?
3. Is there exactly one italic accent word per headline slide?
4. Do section dividers exist, or does the deck read as one long sequence?
5. If you flip through quickly, does it feel like chapters in a book?

If any answer is no, revise before the meeting.
