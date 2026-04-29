# Components

Reusable building blocks with exact specs. Adapt to the medium — these assume web / React conventions, but the visual rules translate to slides, Figma, and documents.

## Eyebrow label (section header)

The signature micro-label. Appears above most section headlines.

```
[●] CHAPTER 01
```

- Accent dot: `inline-block h-1.5 w-1.5 rounded-full bg-accent` (6px violet circle)
- Label: `font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60`
- Gap: 8–12px between dot and label
- Wrap both in an `inline-flex items-center gap-2` container
- Uppercase, monospace, dim — always.

In slides/docs: render as a thin violet dot + small monospace uppercase text, muted gray, letter-spaced. Works at any scale.

## Headline with italic accent word

The Bloque headline pattern.

```
Finance is the last frontier.
```

- Display family, weight 600–700
- Tracking `-0.025em` to `-0.035em`
- Leading `0.95–1.1`
- The accent word (*last*) is rendered in italic **and** takes the accent color `#a78bfa`
- One accent word per beat. Never two.

## Subtitle / lede

- Body sans, weight 400
- Size: `1rem–1.125rem` (16–18px)
- Color: muted foreground
- Max width: ~52ch (the measure) — force line breaks rather than letting copy run to the edge
- Leading: `1.65–1.7`

## Primary CTA

Single per viewport. The brightest element on the page.

- Background: `bg-accent` (violet `#a78bfa`)
- Text: dark violet/near-black for contrast (`#0d0c17` or very dark purple)
- Height: `h-11` (44px)
- Padding: `px-5` (20px) horizontal
- Radius: `rounded-xl` (12px) or `rounded-lg` (8px) — match project convention
- Font: display or body sans, weight 500–600, small (14–15px)
- No drop shadow. Maybe a subtle inner highlight.

## Secondary / ghost CTA

- Background: transparent
- Border: `border border-border/60`
- Text: foreground (near-white)
- Same height/padding as primary
- Hover: border brightens, no fill change

## Card

The universal container.

- Background: `bg-card/40` — subtle purple-tinted surface
- Border: `border border-border/60`
- Radius: `rounded-xl` (12px)
- Padding: `p-5` (20px) default, `p-6` (24px) for featured
- No shadow

### Card with icon

```
┌─────────────────────────────────┐
│ [◇]  Title in display sans      │
│      One line of body copy that │
│      describes what this does.  │
└─────────────────────────────────┘
```

- Icon well: `h-8 w-8 rounded-lg border border-accent/25 bg-accent/[0.06]` with a 3.5w accent icon inside (line-based, ~14px)
- Title: display sans, `0.9375rem` (15px), weight 600, tracking `-0.01em`
- Body: `0.8125rem` (13px), muted foreground, leading `1.6`

## Code snippet (window chrome)

When showing SDK code, commands, or API responses.

- Container: `rounded-xl border border-border/60 bg-surface/80`
- Top bar: three colored dots (macOS traffic lights, dim) + mono filename label, `text-[11px] text-muted-foreground/70`
- Body: monospace, `text-sm` (14px), generous line-height (1.6)
- Syntax colors (see `tokens.md`):
  - Keywords: `accent/75`
  - Strings: `emerald-400/80`
  - Numbers: `orange-400/75`
  - Punctuation: muted
- Padding: `p-4` to `p-6`

## Ambient glow (hero backdrop)

Large radial gradient behind a hero or pivotal moment.

```css
background: radial-gradient(
  ellipse at center top,
  rgba(167, 139, 250, 0.07) 0%,
  transparent 60%
);
```

- Heavy blur (via large gradient radius, not filter)
- Only used once per page — typically behind the hero
- Adds depth without being loud

## Hairline divider

When you need to separate sections but don't want a hard line:

```css
background: linear-gradient(
  to right,
  transparent,
  var(--border) 50%,
  transparent
);
height: 1px;
width: 16px to 24px (short, centered);
```

Never a full-width 1px line.

## Pill / tag

For tags, status badges, category markers.

- Background: `bg-accent/[0.08]` (tinted) or `bg-card/60` (neutral)
- Border: `border border-accent/25` (tinted) or `border-border/50` (neutral)
- Radius: `rounded-full`
- Padding: `px-2.5 py-0.5` (10px / 2px)
- Text: mono, `text-[10px] uppercase tracking-[0.2em]`

## Chapter number

For numbered sections (01, 02, 03) — common in long-form and decks.

- Mono, weight 400
- Size: scales with section; `text-sm` to `text-2xl`
- Color: `text-muted-foreground/40` (very dim) — the number is scaffolding, not content
- Pairs with an eyebrow label

## Metric / stat block

For showing numbers (rails supported, corridors, TPS, etc.):

- Big number: display sans, weight 600, large (32–56px), tight tracking, foreground color
- Label below: mono eyebrow pattern (uppercase, 10–11px, muted, letter-spaced)
- Optional accent dot to left of the label
- Vertical alignment: number-baseline-first

## Button group / toggle

- Wrap in `border border-border/60 rounded-lg p-1`
- Each button: `px-3 py-1.5 text-xs`
- Active state: `bg-accent/10 text-foreground` + subtle border
- Inactive: transparent + muted foreground
- Never use solid violet fills for inactive states

## Navigation

- Sticky top, `bg-background/80 backdrop-blur` on scroll
- Logo left, links center (optional), CTA right
- Link font: mono or sans-14, muted foreground, foreground on hover
- Never a full-width bottom border — use the gradient hairline if separation is needed

## What components should NEVER look like

- No gradient buttons (flat accent fills only)
- No pill CTAs at display size (pills are for micro-labels)
- No drop shadows on cards (use border + subtle background shift instead)
- No rounded-2xl+ on small buttons (radius should scale down with size)
- No white on white — if you find yourself reaching for pure white surfaces, stop
