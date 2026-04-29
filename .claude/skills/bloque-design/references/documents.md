# Documents — Long-form, PDFs, Manifestos, Briefs, Reports

Applying Bloque to written documents meant to be read — not skimmed like a landing or scanned like a deck.

Examples: the Bloque manifesto, investor memos, partner briefs, technical whitepapers, release notes PDFs, one-pagers.

## Canvas

- Page color: `#0d0c17`
- Text color: near-pure white for headings, muted purple-gray for body
- Page size: Letter (8.5×11) or A4 if print-bound; unconstrained vertical for web-based long-form
- Content column: **680px measure** (about 60–75 characters per line) — the readable measure, non-negotiable
- Outer margins: generous. 96–128px top/bottom, 80–120px left/right on Letter

## Document structure

```
[●] MANIFESTO

Finance is the last frontier.
                                                 01 / 07


The lede paragraph sits tight to the title, muted
foreground, about 120–140% line-length of the title,
reading-calibrated leading (1.7).


Body paragraph one. Regular sans body, 400 weight, 16–18px,
leading 1.7, muted foreground color. The measure holds at
about 680px so lines break naturally around 60–75 chars.

Body paragraph two continues the thought. We do not
double-space between paragraphs — a single line break at
1.7 leading creates the rhythm already.

   ·················
   (short hairline divider, centered)

Second section opens the same way — eyebrow, headline,
chapter number.
```

## Typography in long-form

Unlike landings and slides, documents optimize for **reading**, not skimming. Tighten display, loosen body.

| Role | Size | Notes |
|------|------|-------|
| Document title | 40–56px display, weight 700, tracking `-0.03em` | One italic accent word |
| Section heading | 24–32px display, weight 600, tracking `-0.02em` | One per chapter |
| Sub-heading | 18–20px display, weight 600 | Sparing |
| Lede | 18–20px body sans, 500 weight, leading 1.6, foreground | Full paragraph, not one line |
| Body | 16–18px body sans, 400, leading 1.7, muted foreground | The workhorse |
| Pull quote | 24–28px display sans, weight 500, leading 1.3 | Left-aligned, narrower column, thin accent bar on left |
| Footnote / metadata | 12–14px mono, muted, tracked | Page numbers, dates, source labels |
| Inline code | 14–16px mono, `bg-accent/[0.06]`, `px-1.5 py-0.5`, rounded | Within flowing text |

## Rhythm and spacing

- Paragraph spacing: single line break at 1.7 leading — not double
- Section break: a short gradient hairline (16–24px) or 48–64px vertical space, no rule
- Pull quote: full-width within the measure, 64px breathing room above and below
- Never center-align body copy — left-align always

## Accents in documents

Documents tolerate more accent moments than landings, but still restrained:

- The document title's italic accent word (always)
- One section heading per chapter may get an italic accent word
- Pull quotes can use an accent-color vertical bar on the left (2px, 100% height)
- Inline `code` gets a tinted background
- Links are accent-color underlined

That's it. No decorative accent strokes, no accent callout boxes.

## Callouts and sidebars

When a document needs to surface a definition, warning, or aside:

```
┌────────────────────────────────────────────┐
│ [●] NOTE                                   │
│                                            │
│ Short callout text in muted foreground.    │
│ Sits inside a rounded-xl border-border/60  │
│ container with bg-card/40.                 │
└────────────────────────────────────────────┘
```

- Rounded-xl card, `bg-card/40`, `border-border/60`
- Eyebrow at top: accent dot + `NOTE` / `WARNING` / `DEFINITION` (mono, uppercase)
- Body inside
- Never use yellow/red/green warning colors — keep the palette pure

## Tables

- Dark background, `bg-card/40` on alternating rows (or no zebra, just spacing)
- Header row: mono uppercase, tracked, muted foreground
- Body: body sans
- Borders: `border-border/40` between rows, no vertical borders
- Numbers right-aligned, monospace if precision matters

## Code blocks

Same window-chrome treatment as landings:
- `rounded-xl border border-border/60 bg-surface/80`
- Top bar with traffic-light dots + mono filename
- 14–15px monospace body, syntax colors per `tokens.md`
- Full-measure width inside the 680px column

## Running headers / footers

On multi-page docs (print or scrolling):

- Top-left: `bloque` wordmark (small, muted) or section name
- Top-right: mono page number `03 / 07`
- Bottom: thin gradient hairline, short, centered — optional
- Never a full-width rule, never drop shadows

## Figure / image treatment

- Full-width within the 680px measure (or breakout wider with mono caption below)
- Rounded corners: `rounded-xl`
- Border: `border-border/60`
- Caption: below image, mono uppercase label + body-sans description, muted foreground, centered

## Manifesto / narrative voice

When the document is voice-forward (manifesto, founder memo):

- Shorter paragraphs (2–4 lines)
- More one-sentence paragraphs for rhythm
- Italic accent words appear mid-paragraph, not only in headlines
- Pull quotes extract signature phrases:
  - *Finance is the last frontier.*
  - *The builder of your financial stack should be you.*
- White space between thoughts does narrative work

## Exporting

**Web (HTML)**:
- Dark background persists below the fold — don't let browser white leak through
- `scroll-behavior: smooth` for TOC anchors
- Sticky slim TOC on left rail (optional) using mono labels

**PDF**:
- Embed fonts
- Check contrast — muted foreground at 60% can under-print; bump to 70% for print PDFs
- Hyperlinks: keep accent color, maintain underline for print
- Cover page: pure hero treatment (ambient glow, title, eyebrow, author/date)

## Reviewing a document — five checks

1. Does the measure hold at ~680px? (Long lines kill reading.)
2. Is the leading 1.65–1.7 for body? (Tight body reads cramped.)
3. Are italic accent words limited to title + ~1 per chapter?
4. Does each section open the same way (eyebrow + headline + number)?
5. If printed on paper, does this feel like a book from a design-minded publisher, or a Word doc?

The bar is "this could be published by a design-minded imprint."
