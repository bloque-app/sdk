---
name: bloque-design
description: >
  Bloque's design system and how to apply it across every visual surface —
  landing pages, slides, presentations, pitch decks, long-form documents,
  social cards, emails, internal tools, and product UI. Covers the brand
  personality (premium, engineered, trustworthy — a precision instrument,
  not playful, not corporate, not crypto-bro), color palette (dark purple
  canvas `#0d0c17` + surgical violet accent `#a78bfa`), three-voice typography
  (compressed display / clean sans body / mono labels and code), spacing
  and density rules, component conventions (cards, CTAs, eyebrows, code
  snippets, ambient glow, hairline dividers), anti-patterns to avoid
  (crypto-bro, generic SaaS, traditional banking), and medium-specific
  guidance for slides, docs, landings, and presentations. Use whenever
  designing, reviewing, or building any Bloque-branded output.
license: MIT
metadata:
  author: bloque
  version: "1.0.0"
---

# Bloque — Design System

The canonical guide for how Bloque looks, applied across every medium we ship to.

**Source of truth**: `apps/bricks-universal/.impeccable.md` (matches `bloque.app` production). If anything in this skill conflicts with `.impeccable.md`, `.impeccable.md` wins.

> Note: `apps/bricks-universal/DESIGN.md` documents a Cursor-inspired *warm-cream* system. It is **research/reference only** — not the current direction. Don't apply it to Bloque surfaces.

## When to apply

Use this skill any time you're producing a Bloque surface:

- **Landings** — marketing pages, product pages, flows
- **Slides / presentations** — pitch decks, investor decks, internal reviews, demos
- **Documents** — long-form writing, PDFs, manifestos, briefs, reports, one-pagers
- **Social & email** — LinkedIn posts, Twitter cards, newsletters, announcements
- **Product UI** — dashboards, internal tools, app surfaces
- **Micro-assets** — favicons, OG images, sticker designs, cover images

Also use it to **review** existing work — run the checklist in `references/anti-patterns.md` before shipping.

## The essentials (memorize these)

If you only remember four things:

1. **Dark purple canvas** — `#0d0c17`. Not black, not navy, not neutral gray. Every surface has a subtle purple undertone.
2. **Violet accent, surgical** — `#a78bfa` appears **exactly 2–3 times per viewport**. Overuse kills its power.
3. **Three typographic voices** — compressed display headings, clean sans body, mono for labels and code. Never mix roles.
4. **Density signals competence** — show the product's depth confidently. Don't hide behind "simplicity."

## Quick token reference

| Token | Value | Role |
|-------|-------|------|
| Background | `#0d0c17` | Canonical canvas |
| Foreground | near-pure white | Headings, primary text |
| Muted foreground | muted purple-gray | Body, secondary text |
| Accent | `#a78bfa` | CTAs, active states, italicized emphasis words |
| Border | `border/60` (dim) | Card edges, hairlines |
| Accent glow | `rgba(167,139,250,0.07)` | Ambient hero backdrop, heavy blur |

Display tracking: `-0.025em` to `-0.035em`. Body line-height: `1.65–1.7`. Mono labels: uppercase, `tracking-[0.22em]–[0.3em]`, 10–11px.

## Progressive disclosure — jump to the file you need

| Question | File |
|----------|------|
| What are the exact tokens, sizes, and spacing values? | `references/tokens.md` |
| What are the brand principles and personality? | `references/principles.md` |
| How do I build cards, buttons, eyebrows, code blocks? | `references/components.md` |
| How do I apply Bloque to **landing pages**? | `references/landings.md` |
| How do I apply Bloque to **slides / decks / presentations**? | `references/slides.md` |
| How do I apply Bloque to **documents, PDFs, long-form**? | `references/documents.md` |
| What should I **never** do — and what's the final ship checklist? | `references/anti-patterns.md` |

## One-line design brief

Dark purple-black canvas with surgical violet accent, compressed display type with mono micro-labels, dense information arranged with open whitespace — the visual equivalent of a well-machined tool.
