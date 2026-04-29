# Anti-patterns & Ship Checklist (Light)

What will break the brand in light mode, and the final pre-ship gate.

## The three anti-references (same as dark)

### ❌ Web3 / crypto energy
- Neon pink/green gradients
- Glowing text, oversaturated purples, candy-colored accents
- 3D chrome, glassmorphism, "liquid" effects
- "To the moon," 🚀, degen typography
- Space/cosmos backgrounds

**Tell**: if you added a glow "to make it pop," you drifted. Bloque's glow is ambient and barely-there. On light, the glow is heavier (0.18 alpha vs 0.07 dark) to compensate for the canvas — but it's still ambient, not loud.

### ❌ Generic SaaS template — **the light-mode trap**
- Hero with single line of copy + giant button
- 3-column features grid with cartoon icons
- Stock photos of smiling people at laptops
- "Empower your business" boilerplate
- Pastel gradient CTAs (blue→purple, pink→orange, teal→green)
- Testimonials without specific outcomes
- "Trusted by" logo wall with 12 logos

**Tell**: if you could swap the product name and the page would still work, it's generic. Light mode is where every SaaS page converges — Bloque's light surface has to work harder to stay distinct. The typography and italic-accent-word rhythm is what saves it.

### ❌ Traditional banking / fintech-old
- Navy blue anywhere (not even as a "trust" signal)
- Serif headlines for "trustworthiness"
- Stock photos of handshakes, skyscrapers, diverse teams
- Shield icons, lock icons, "bank-grade security" copy
- **Beige / cream / warm-yellow canvas** — if your `#faf9fc` drifts toward `#f5f2ea`, you're in banking territory. Pull it back cool.
- Conservative layouts (centered, symmetric, formal)

**Tell**: if it looks like your grandparents' bank's website, you drifted. Bloque is for the builders banks ignored — in light mode as much as dark.

## Specific moves to avoid (light-specific)

### Palette mistakes
- Using pure `#ffffff` for the page canvas instead of `#faf9fc` (loses the purple undertone)
- Using pure `#ffffff` for card surfaces — surfaces step **down** from canvas (`#f2f0f7`), not up
- Using neutral gray (`#f5f5f5`, `#fafafa`) instead of purple-tinted
- Using cream (`#faf8f2`, `#f5f1e8`) — this is the Cursor-style warm system, NOT Bloque. The `DESIGN.md` in `apps/bricks-universal/` is the wrong reference.
- Setting body text or CTAs in **soft violet** `#a78bfa` — it fails contrast on light. Use `#7c3aed` for text/CTA; `#a78bfa` for tint fills only.
- Applying deep violet `#7c3aed` to more than 3 elements per viewport
- Using additional accent colors (no blue accents, no gradient accents, no rainbow)

### Typography mistakes
- Setting body in mono (mono is for labels and code)
- Headings without negative tracking
- Italic for decorative emphasis (italic is THE accent word only)
- Mixing more than three font families
- All-caps for body (caps only for mono eyebrows/labels)
- Full-justified text (always left-align)
- Body text below 16px on light — small text reads thinner on light than dark, bumps legibility problems

### Layout mistakes
- Hero with massive empty space and one sentence (density still signals competence on light)
- Thin 1px full-width horizontal rules (use gradient hairlines)
- Centered body copy (always left-align)
- Drop shadows on cards (use surface-tone step + border)
- Hard-edged boxes of solid accent fill
- **Heavy elevation shadows** — the light-theme shortcut that tries to compensate for lost dark-bg depth. Resist. Use surface tone steps (`#faf9fc` → `#f2f0f7` → `#ebe8f1`) instead.

### Component mistakes
- Multiple primary CTAs on the same viewport
- Gradient-filled buttons
- Pill-shaped buttons at display sizes
- Stock iconography (Font Awesome, Material Icons default)
- Testimonial carousels with smiling avatars
- Pricing tables with "Most Popular" burst badges
- Using `#a78bfa` soft violet on anything that needs to be read (text, thin icons)

### Copy-in-design mistakes
- Running three italic accent words in one headline
- Italic for neutral emphasis
- Adjective-stacks ("Revolutionary. Powerful. Secure.")
- Hype language ("game-changing," "revolutionary," "best-in-class")
- Long feature lists without hierarchy

### Motion mistakes
- Bounce / elastic easing
- 3D rotation / card flips
- Parallax scrolling on hero
- "Counting up" metric animations on load
- Emoji reactions / floating hearts
- Any motion over 350ms

### Light-mode-specific mistakes
- **Forgetting the inverted-dark moment.** A long light page without a single inverted section feels like a different brand. The dark final-CTA (landing) or statement slide (deck) is a signature — it reminds the viewer this is Bloque.
- **Cream drift.** If the canvas warms toward yellow, the brand is gone. Pull back cool — `#faf9fc` is purple-tinted, not cream.
- **Lightening surfaces instead of darkening.** On light, "elevation" is a step **down** the surface scale (`#faf9fc` → `#f2f0f7`), not up. Adding `#ffffff` highlights to cards is a SaaS-template reflex. Don't.

## The "is this Bloque light?" ship checklist

### Palette
- [ ] Background is `#faf9fc` (purple-tinted near-white) — not `#fff`, not cream, not neutral
- [ ] Surfaces step **down** from canvas (`#f2f0f7`, `#ebe8f1`), never up to white
- [ ] No cream / warm-yellow drift
- [ ] Deep violet `#7c3aed` used for all accent text / CTAs / italic words
- [ ] Soft violet `#a78bfa` only on tint surfaces, glows, icon wells — never on text
- [ ] Deep violet appears in ≤3 places per viewport/slide/spread
- [ ] No secondary accent colors

### Typography
- [ ] Display headings use compressed tracking (`-0.025em` to `-0.035em`)
- [ ] At most one italic `#7c3aed` accent word per headline
- [ ] Body uses sans, leading 1.65–1.7, color `#5a5770`
- [ ] Mono used only for labels, eyebrows, code, metadata
- [ ] Eyebrows are uppercase, tracked (`0.22em+`), small (10–11px), `#8b88a0`

### Structure
- [ ] Every section opens with eyebrow (`#7c3aed` dot + mono label)
- [ ] Headline → lede → content rhythm is consistent
- [ ] One primary CTA per viewport (final CTA exempted)
- [ ] Hairline dividers (if any) are short gradient fades, not 1px rules
- [ ] At least one deliberate inverted-dark moment (final CTA / statement slide / code demo) — the brand signature

### Anti-references
- [ ] No crypto signals (neon, 3D, space imagery, degen language)
- [ ] No generic-SaaS signals (3-column grid, stock photos, "empower")
- [ ] No traditional-banking signals (navy, handshakes, shield icons, cream)

### Feel
- [ ] Reads as a precision instrument — not playful, not corporate, not crypto-bro
- [ ] Dense where it counts, open where it breathes
- [ ] A developer thinks "real engineers built this"
- [ ] A CFO thinks "these people are serious"
- [ ] Would Linear ship this (in their light theme)?
- [ ] Placed next to the dark version, clearly reads as the same brand

### Copy
- [ ] No adjective-stacks
- [ ] No boilerplate
- [ ] Specific > generic everywhere
- [ ] One italic accent word per headline carries the thesis

### Contrast & accessibility
- [ ] Body text `#5a5770` on `#faf9fc` passes AA (verified)
- [ ] Accent `#7c3aed` on `#faf9fc` passes AA for all text use
- [ ] No text set in soft violet `#a78bfa`
- [ ] On inverted dark sections, dark-mode contrast rules apply

If **any** box doesn't check, revise before shipping.

## Rescue moves (when a light design is off)

In order:

1. **Check the canvas temperature.** If it drifts warm/yellow, push back toward the cool purple `#faf9fc`.
2. **Check the accent weight.** If you see `#a78bfa` on text, swap to `#7c3aed`. If you see 4+ deep-violet elements, remove until 2–3.
3. **Check for elevation shortcuts.** Remove drop shadows. Replace with surface-tone steps + border.
4. **Tighten the headline.** Add negative tracking. One italic accent word, not two.
5. **Add an eyebrow** if a section is missing one.
6. **Add the inverted moment.** If the piece is long (a landing, a deck, a long-form doc) and has no inverted-dark section, add one — it's the brand signature for light.
7. **Cut the filler.** Delete any section that doesn't pass "does this do work?"
8. **Look at it next to the dark version** of the same content. If the two don't clearly read as the same brand, the light has lost the thread.

If after all eight moves it still feels off, the foundation is wrong — start over from the scaffold (eyebrow → headline → content) rather than patching.
