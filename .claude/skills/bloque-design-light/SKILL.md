---
name: bloque-design-light
description: >
  Bloque's **light-mode** design system and how to apply it across every visual
  surface — landing pages, slides, presentations, pitch decks, long-form
  documents, social cards, emails, internal tools, and product UI. The light
  companion to `bloque-design` (dark). Same brand personality (premium,
  engineered, trustworthy — a precision instrument, not playful, not corporate,
  not crypto-bro), same three-voice typography, same structural scaffolds and
  anti-patterns — inverted palette built around a warm purple-tinted near-white
  canvas `#faf9fc` with surgical deep-violet accent `#7c3aed` (and soft violet
  `#a78bfa` for ambient tints). Use whenever designing, reviewing, or building
  any Bloque-branded output that should read light — investor decks for bright
  rooms, print-bound docs, editorial long-form, light-themed product surfaces,
  OG images for feeds that default to light, paper-feel PDFs.
license: MIT
metadata:
  author: bloque
  version: "1.0.0"
---

# Bloque — Design System (Light)

The canonical guide for how Bloque looks in **light mode**, applied across every medium we ship to.

**Companion skill**: `bloque-design` covers the canonical dark theme (`#0d0c17` canvas). This skill is the light mirror. Both are valid Bloque — pick the one that fits the medium.

**Source of truth**: the dark canvas `#0d0c17`, accent `#a78bfa`, and three-voice typography in `apps/bricks-universal/.impeccable.md` define the brand. The light system inverts the canvas and derives an accessible companion accent — everything else (principles, structure, typography, anti-patterns) is identical.

## When to use *light* instead of *dark*

Default to dark. Reach for light when the medium calls for it:

- **Print / paper-bound docs** — dark ink on light paper reproduces better than the inverse
- **Decks for bright rooms** — projectors wash out dark slides under daylight
- **Editorial long-form** — traditional reading surfaces (whitepapers, essays, manifestos in print)
- **OG / social cards for light-default feeds** — LinkedIn, mail previews
- **Light product surfaces** — settings pages, docs portals, print/export views
- **Side-by-side comparisons** — when a page needs both themes for a toggle demo

If the surface lives on screen, in a dim room, or on `bloque.app` proper — use dark. The brand's home is dark.

## When to apply (same as dark)

- **Landings** — light marketing pages, docs portals, print-style essays
- **Slides / presentations** — decks for bright rooms, training decks, printable handouts
- **Documents** — long-form writing, PDFs, manifestos, briefs, reports, one-pagers
- **Social & email** — OG images, newsletters, announcements
- **Product UI** — light-themed dashboards, docs, settings
- **Micro-assets** — favicons, covers, sticker designs

Also use it to **review** existing work — run the checklist in `references/anti-patterns.md` before shipping.

## The essentials (memorize these)

If you only remember four things:

1. **Warm near-white canvas** — `#faf9fc`. Not pure white, not gray, not cream. Every surface has a subtle purple undertone that ties it to dark-mode Bloque.
2. **Deep-violet accent, surgical** — `#7c3aed` for text / CTAs / active states, `#a78bfa` reserved for tint surfaces and ambient glows. Accent still appears **exactly 2–3 times per viewport**.
3. **Three typographic voices** — compressed display headings, clean sans body, mono for labels and code. Never mix roles.
4. **Density signals competence** — show the product's depth confidently. Don't hide behind "simplicity." (Same rule as dark — light is not permission to lighten the information weight.)

## Quick token reference

| Token | Value | Role |
|-------|-------|------|
| Background | `#faf9fc` | Canonical canvas — warm purple-tinted near-white |
| Surface | `#f2f0f7` | Card / container background |
| Elevated surface | `#ebe8f1` | Modals, code windows, featured cards |
| Foreground | `#0d0c17` | Headings, primary text — the same color as dark-mode canvas |
| Muted foreground | `#5a5770` | Body, secondary text |
| Muted foreground / subtle | `#8b88a0` | Eyebrow labels, metadata |
| Accent (deep) | `#7c3aed` | CTAs, active states, italicized accent word, links |
| Accent (soft) | `#a78bfa` | Tint fills, ambient glow, icon wells |
| Border | `rgba(13,12,23,0.10)` | Card edges, hairlines |
| Border strong | `rgba(13,12,23,0.18)` | Emphasized borders, active input |
| Accent glow | `rgba(167,139,250,0.18)` | Ambient hero backdrop (heavier alpha than dark — light needs more to read) |

Display tracking: `-0.025em` to `-0.035em`. Body line-height: `1.65–1.7`. Mono labels: uppercase, `tracking-[0.22em]–[0.3em]`, 10–11px. (Identical to dark.)

## Progressive disclosure — jump to the file you need

| Question | File |
|----------|------|
| What are the exact tokens, sizes, and spacing values? | `references/tokens.md` |
| What are the brand principles and personality? | `references/principles.md` |
| How do I build cards, buttons, eyebrows, code blocks? | `references/components.md` |
| How do I apply light Bloque to **landing pages**? | `references/landings.md` |
| How do I apply light Bloque to **slides / decks / presentations**? | `references/slides.md` |
| How do I apply light Bloque to **documents, PDFs, long-form**? | `references/documents.md` |
| What should I **never** do — and what's the final ship checklist? | `references/anti-patterns.md` |

## One-line design brief

Warm purple-tinted near-white canvas with surgical deep-violet accent, compressed display type with mono micro-labels, dense information arranged with open whitespace — the light counterpart to dark Bloque, same precision-instrument feel on paper instead of screen.
