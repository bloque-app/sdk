# Documents — Long-form, PDFs, Manifestos, Briefs, Reports (Light)

Applying Bloque light-mode to written documents meant to be read. Light is the **preferred** medium here — dark ink on a light canvas is the tradition of editorial reading, and print reproduces light docs better than dark.

Examples: Bloque manifesto (print edition), investor memos, partner briefs, technical whitepapers, release notes PDFs, one-pagers, internal reports.

## Canvas

- Page color: `#faf9fc`
- Text color: `#0d0c17` for headings, `#5a5770` for body
- Page size: Letter (8.5×11) or A4 if print-bound; unconstrained vertical for web long-form
- Content column: **680px measure** (60–75 characters per line) — non-negotiable
- Outer margins: generous. 96–128px top/bottom, 80–120px left/right on Letter

## Document structure

```
[●] MANIFESTO

Finance is the last frontier.
                                                 01 / 07


The lede paragraph sits tight to the title, color #5a5770,
120–140% line-length of the title, reading-calibrated
leading (1.7).


Body paragraph one. Regular sans body, 400 weight, 16–18px,
leading 1.7, color #5a5770. The measure holds at about
680px so lines break naturally around 60–75 chars.

Body paragraph two continues the thought. No double-spacing
between paragraphs — a single line break at 1.7 leading
creates the rhythm already.

   ·················
   (short hairline divider, centered)

Second section opens the same way — eyebrow, headline,
chapter number.
```

## Typography in long-form

Light documents optimize for **reading**. Tighten display, loosen body.

| Role | Size | Color | Notes |
|------|------|-------|-------|
| Document title | 40–56px display, weight 700, tracking `-0.03em` | `#0d0c17` | One italic `#7c3aed` accent word |
| Section heading | 24–32px display, weight 600, tracking `-0.02em` | `#0d0c17` | One per chapter |
| Sub-heading | 18–20px display, weight 600 | `#0d0c17` | Sparing |
| Lede | 18–20px body sans, 500 weight, leading 1.6 | `#0d0c17` | Full paragraph, not one line |
| Body | 16–18px body sans, 400, leading 1.7 | `#5a5770` | The workhorse |
| Pull quote | 24–28px display sans, weight 500, leading 1.3 | `#0d0c17` | Left-aligned, narrower column, thin `#7c3aed` bar on left |
| Footnote / metadata | 12–14px mono, tracked | `#8b88a0` | Page numbers, dates, source labels |
| Inline code | 14–16px mono, `bg-[rgba(167,139,250,0.14)]`, `px-1.5 py-0.5`, rounded | `#7c3aed` | Within flowing text |

**Print contrast note**: for print output, step muted-foreground darker from `#5a5770` → `#3f3d52`. Screen rendering forgives 7:1 body contrast; ink on paper prints slightly lighter than the spec, so start darker.

## Rhythm and spacing

- Paragraph spacing: single line break at 1.7 leading — not double
- Section break: short gradient hairline (16–24px) or 48–64px vertical space, no rule
- Pull quote: full-width within the measure, 64px breathing room above and below
- Never center-align body copy — left-align always

## Accents in documents

Documents tolerate more accent moments than landings, but still restrained:

- The document title's italic `#7c3aed` accent word (always)
- One section heading per chapter may get an italic accent word
- Pull quotes can use a `#7c3aed` vertical bar on the left (2px, 100% height)
- Inline `code` gets a `rgba(167,139,250,0.14)` tint background with `#7c3aed` text
- Links are `#7c3aed` underlined

That's it. No decorative accent strokes, no accent callout boxes.

## Callouts and sidebars

```
┌────────────────────────────────────────────┐
│ [●] NOTE                                   │
│                                            │
│ Short callout text in color #5a5770.       │
│ Sits inside a rounded-xl                   │
│ border-[rgba(13,12,23,0.10)]               │
│ container with bg-[#f2f0f7].               │
└────────────────────────────────────────────┘
```

- Rounded-xl card, `bg-[#f2f0f7]`, `border-[rgba(13,12,23,0.10)]`
- Eyebrow: `#7c3aed` dot + `NOTE` / `WARNING` / `DEFINITION` (mono, uppercase, `#8b88a0`)
- Body inside, `#5a5770`
- Never use yellow/red/green warning colors — keep the palette pure

## Tables

- Alternating row background: `bg-[#f2f0f7]` on even rows (or no zebra, just spacing)
- Header row: mono uppercase, tracked, `#8b88a0`, on `#ebe8f1` surface
- Body: body sans, `#0d0c17` for primary data, `#5a5770` for secondary
- Borders: `border-[rgba(13,12,23,0.10)]` between rows, no vertical borders
- Numbers right-aligned, monospace if precision matters

## Code blocks

Same window-chrome treatment as landings:
- `rounded-xl border border-[rgba(13,12,23,0.10)] bg-[#ebe8f1]`
- Top bar: muted traffic-light dots + mono filename in `#8b88a0`
- 14–15px monospace body, syntax colors per `tokens.md`
- Full-measure width inside the 680px column

**High-impact variant**: one code block per long-form doc can be **inverted dark** — pair the brand's dark canvas with the editorial light body. Use at the thesis moment.

## Running headers / footers

On multi-page docs (print or scrolling):

- Top-left: `bloque` wordmark (small, `#8b88a0`) or section name
- Top-right: mono page number `03 / 07` in `#8b88a0`
- Bottom: short centered gradient hairline — optional
- Never a full-width rule

## Figure / image treatment

- Full-width within the 680px measure (or breakout wider with mono caption below)
- Rounded corners: `rounded-xl`
- Border: `border-[rgba(13,12,23,0.10)]`
- Caption: mono uppercase label + body-sans description, `#8b88a0`, centered below image

## Manifesto / narrative voice

When the document is voice-forward (manifesto, founder memo):

- Shorter paragraphs (2–4 lines)
- More one-sentence paragraphs for rhythm
- Italic `#7c3aed` accent words appear mid-paragraph, not only in headlines
- Pull quotes extract signature phrases:
  - *Finance is the last frontier.*
  - *The builder of your financial stack should be you.*
- White space between thoughts does narrative work

## Exporting

**Web (HTML)**:
- Light canvas persists below the fold — don't let browser defaults bleed
- `scroll-behavior: smooth` for TOC anchors
- Sticky slim TOC on left rail (optional), mono labels, `#8b88a0`

**PDF**:
- Embed fonts
- Step muted-foreground from 60% → 70% effective darkness for print (use `#3f3d52` instead of `#5a5770` on print-targeted runs)
- Hyperlinks: keep `#7c3aed`, maintain underline for print
- Cover page: hero treatment (ambient glow, title, eyebrow, author/date) — still light, unless the doc wants a dark cover for editorial impact

**Print**:
- CMYK-convert accent `#7c3aed` and verify it doesn't muddy — deep violet on cheap paper can print toward navy. Test-print before finalizing.
- Ambient glow may drop out on non-coated stock — accept this, the glow is a screen-only atmospheric effect
- Paper: matte uncoated reads closer to the on-screen `#faf9fc` warmth than gloss coated

## Reviewing a light document — five checks

1. Does the measure hold at ~680px? (Long lines kill reading.)
2. Is the leading 1.65–1.7 for body? (Tight body reads cramped.)
3. Are italic `#7c3aed` accent words limited to title + ~1 per chapter?
4. Does each section open the same way (eyebrow + headline + number)?
5. If printed on paper, does this feel like a book from a design-minded publisher, or a Word doc?

The bar: "this could be published by a design-minded imprint." Same bar as dark — light just has to carry it on paper too.
