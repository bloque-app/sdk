# Components (Light)

Reusable building blocks with exact specs for **light mode**. Mirrors `bloque-design/references/components.md` with light-calibrated tokens.

## Eyebrow label (section header)

The signature micro-label. Same structure as dark.

```
[●] CHAPTER 01
```

- Accent dot: `inline-block h-1.5 w-1.5 rounded-full bg-[#7c3aed]` (6px deep-violet circle)
- Label: `font-mono text-[10px] uppercase tracking-[0.28em] text-[#8b88a0]`
- Gap: 8–12px between dot and label
- Wrap in `inline-flex items-center gap-2`

On inverted (`#0d0c17`) sections within a light doc, switch the dot to `#a78bfa` and label to `rgba(255,255,255,0.6)` — same eyebrow pattern, dark-mode colors.

## Headline with italic accent word

```
Finance is the last frontier.
```

- Display family, weight 600–700
- Tracking `-0.025em` to `-0.035em`
- Leading `0.95–1.1`
- Foreground color: `#0d0c17`
- Accent word (*last*) in italic **and** `#7c3aed`
- One accent word per beat. Never two.

## Subtitle / lede

- Body sans, weight 400
- Size: `1rem–1.125rem` (16–18px)
- Color: `#5a5770` (muted foreground)
- Max width: ~52ch (the measure)
- Leading: `1.65–1.7`

## Primary CTA

Single per viewport. The brightest element on the page — on light this means the **highest-contrast** element, not the loudest.

- Background: `bg-[#7c3aed]` (deep violet) or `bg-[#0d0c17]` (foreground) — both work; pick per context
- Text: `#ffffff` on violet, `#faf9fc` on foreground
- Height: `h-11` (44px)
- Padding: `px-5` (20px)
- Radius: `rounded-xl` (12px) or `rounded-lg` (8px) — match project convention
- Font: display or body sans, weight 500–600, small (14–15px)
- No drop shadow. Slight hover lift: background darkens one step (`#6d28d9` for violet, `#1a1826` for foreground-bg CTA).

**Rule of thumb**: violet-filled CTA = the headline action. Foreground-filled CTA = the secondary-primary (e.g. "Read the docs" when "Start building" is also on-screen). Never two violet CTAs in one viewport.

## Secondary / ghost CTA

- Background: transparent
- Border: `border border-[rgba(13,12,23,0.18)]`
- Text: `#0d0c17`
- Same height/padding as primary
- Hover: border deepens to `rgba(13,12,23,0.30)`, background tints to `rgba(13,12,23,0.03)`

## Card

- Background: `bg-[#f2f0f7]`
- Border: `border border-[rgba(13,12,23,0.10)]`
- Radius: `rounded-xl` (12px)
- Padding: `p-5` default, `p-6` for featured
- No shadow by default. On hover, apply the elevated shadow from `tokens.md`.

### Card with icon

```
┌─────────────────────────────────┐
│ [◇]  Title in display sans      │
│      One line of body copy that │
│      describes what this does.  │
└─────────────────────────────────┘
```

- Icon well: `h-8 w-8 rounded-lg border border-[rgba(124,58,237,0.25)] bg-[rgba(167,139,250,0.14)]` — the soft-violet tint surface is legal here (non-text use)
- Icon itself: `#7c3aed`, line-based, ~14px, 1.5px stroke
- Title: display sans, 15px, weight 600, tracking `-0.01em`, color `#0d0c17`
- Body: 13px, color `#5a5770`, leading 1.6

## Code snippet (window chrome)

- Container: `rounded-xl border border-[rgba(13,12,23,0.10)] bg-[#ebe8f1]`
- Top bar: three colored dots (muted — not the macOS-bright red/yellow/green, use `#d1cfd9` tones) + mono filename label, `text-[11px] text-[#8b88a0]`
- Body: monospace, 14px, leading 1.6
- Syntax colors (per `tokens.md`):
  - Keywords: `#7c3aed`
  - Strings: `#047857`
  - Numbers: `#c2410c`
  - Punctuation: `#8b88a0`
- Text color (default): `#0d0c17`
- Padding: `p-4` to `p-6`

**Alternative**: for hero-moment code demos, use an inverted code window with dark-mode tokens (`bg-[#0d0c17]`, accent `#a78bfa` keywords). This creates a high-impact contrast moment. Limit to once per page.

## Ambient glow (hero backdrop)

Large radial gradient behind a hero or pivotal moment. Alpha is higher than dark because light canvases swallow subtle glows.

```css
background: radial-gradient(
  ellipse at center top,
  rgba(167, 139, 250, 0.18) 0%,
  transparent 60%
);
```

- Heavy blur via gradient radius, not filter
- Only used once per page — behind the hero
- Adds depth without being loud

## Hairline divider

```css
background: linear-gradient(
  to right,
  transparent,
  rgba(13, 12, 23, 0.10) 50%,
  transparent
);
height: 1px;
width: 16px to 24px;
```

Never a full-width 1px line. Same rule as dark.

## Pill / tag

- Background: `bg-[rgba(167,139,250,0.14)]` (tinted) or `bg-[#f2f0f7]` (neutral)
- Border: `border border-[rgba(124,58,237,0.25)]` (tinted) or `border-[rgba(13,12,23,0.10)]` (neutral)
- Text color: `#7c3aed` (tinted pill) or `#5a5770` (neutral pill)
- Radius: `rounded-full`
- Padding: `px-2.5 py-0.5`
- Text: mono, `text-[10px] uppercase tracking-[0.2em]`

## Chapter number

- Mono, weight 400
- Size: scales with section; `text-sm` to `text-2xl`
- Color: `#a8a5ba` (muted foreground / dim) — very dim, the number is scaffolding
- Pairs with an eyebrow label

## Metric / stat block

- Big number: display sans, weight 600, large (32–56px), tight tracking, color `#0d0c17`
- Label below: mono eyebrow pattern (uppercase, 10–11px, `#8b88a0`, tracked)
- Optional accent dot (`#7c3aed`) to left of label
- Vertical alignment: number-baseline-first

## Button group / toggle

- Wrap in `border border-[rgba(13,12,23,0.10)] rounded-lg p-1`
- Each button: `px-3 py-1.5 text-xs`
- Active state: `bg-[rgba(167,139,250,0.14)] text-[#0d0c17]` + subtle violet border tint
- Inactive: transparent + `text-[#5a5770]`
- Never use solid violet fills for inactive states

## Navigation

- Sticky top, `bg-[#faf9fc]/80 backdrop-blur-md` on scroll
- Logo left, links center (optional), CTA right
- Link font: mono or sans-14, color `#5a5770`, foreground (`#0d0c17`) on hover
- Never a full-width bottom border — use the gradient hairline if separation is needed
- On scroll past hero: optional thin border-bottom `rgba(13,12,23,0.10)` for scroll-elevation feedback

## Inverted section (mid-document)

A deliberate dark moment inside a light document — final CTA, hero quote, code demo.

- Background: `#0d0c17`
- Inside this section, **switch to dark-mode tokens**: foreground `#ffffff`, muted `rgba(255,255,255,0.6)`, accent `#a78bfa`, borders `rgba(255,255,255,0.10)`
- Use sparingly — one inverted section per long page max. Two reads gimmicky.
- Great for: the final CTA before the footer, a full-bleed quote, a hero code demo

## What components should NEVER look like (light)

- No gradient buttons (flat accent fills only)
- No pill CTAs at display size (pills are for micro-labels)
- No drop shadows on cards by default (use surface-tone step + border instead)
- No `#a78bfa` on text or CTAs — soft violet is decorative only on light
- No pure white surfaces — if you reach for `#ffffff` as a surface, stop
- No cream / warm-yellow drift — if `#faf9fc` looks yellow next to your content, rebalance
- No Google Material / Bootstrap-style elevation shadows — if you need depth, step the surface tone
