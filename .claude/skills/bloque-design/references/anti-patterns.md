# Anti-patterns & Ship Checklist

What will break the brand, and the final pre-ship gate.

## The three anti-references (never drift here)

### ❌ Web3 / crypto energy
- Neon pink/green gradients
- Glowing text, oversaturated purples, candy-colored accents
- 3D chrome, glassmorphism for its own sake, "liquid" effects
- "To the moon," 🚀, diamond hands, degen typography
- Space/cosmos backgrounds

**Tell**: if you added a glow "to make it pop," you drifted. Bloque's glow is ambient and barely-there. Nothing *pops* — everything *sits*.

### ❌ Generic SaaS template
- Hero with single line of copy + giant button
- 3-column features grid with cartoon icons
- Stock photos of smiling people at laptops
- "Empower your business" / "Transform your workflow" boilerplate
- Pastel gradient CTAs (blue→purple, pink→orange, etc.)
- Testimonials that don't quote a specific outcome
- "Trusted by" logo wall with 12 logos

**Tell**: if you could swap the product name and the page would still work, it's generic. Bloque is specific.

### ❌ Traditional banking / fintech-old
- Navy blue primary
- Serif headlines for "trustworthiness"
- Stock photos of handshakes, skyscrapers, "diverse team"
- Shield icons, lock icons, "bank-grade security" copy
- Beige / cream neutrals
- Conservative layouts (centered, symmetric, formal)

**Tell**: if it looks like your grandparents' bank's website, you drifted. Bloque is for the builders banks ignored.

## Specific moves to avoid

### Palette mistakes
- Using pure `#000000` for background instead of `#0d0c17`
- Using neutral gray (`#1a1a1a`) instead of purple-tinted
- Using pure `#ffffff` for surfaces (no white cards)
- Applying violet `#a78bfa` to more than 3 elements per viewport
- Using additional accent colors (no blue accents, no gradient accents, no rainbow)

### Typography mistakes
- Setting body copy in mono (mono is for labels and code)
- Setting headings without negative tracking (defaults look weak)
- Using italic for decorative emphasis (italic is reserved for THE accent word)
- Mixing more than three font families
- Using all-caps for body copy (caps only for mono eyebrows/labels)
- Full-justified text (always left-align)

### Layout mistakes
- Hero with massive empty space and one sentence (density signals competence)
- Thin 1px full-width horizontal rules (use gradient hairlines instead)
- Centered-aligned body copy (always left-align)
- Drop shadows on cards (use border + surface variation)
- Hard-edged boxes of solid accent fill (the accent is surgical, not splashy)

### Component mistakes
- Multiple primary CTAs on the same viewport
- Gradient-filled buttons
- Pill-shaped buttons at display sizes (pills are for micro-labels)
- Stock iconography (Font Awesome, Material Icons default set)
- Testimonial carousels with smiling avatars
- Pricing tables with "Most Popular" burst badges

### Copy-in-design mistakes
- Running three italic accent words in one headline
- Using italic for neutral emphasis
- Adjectives without nouns ("Revolutionary. Powerful. Secure.")
- Hype language ("game-changing," "revolutionary," "best-in-class")
- Long feature lists without hierarchy

### Motion mistakes
- Bounce / elastic easing
- 3D rotation / card flips
- Parallax scrolling on hero
- "Counting up" metric animations on load
- Emoji reactions / floating hearts
- Any motion over 350ms (feels slow)

## The "is this Bloque?" ship checklist

Before shipping any surface (landing, slide, doc, social, email):

### Palette
- [ ] Background is `#0d0c17` (or consistent dark purple-tinted surface)
- [ ] No pure black, no neutral gray, no navy, no white surfaces
- [ ] Violet `#a78bfa` appears in ≤3 places per viewport/slide/spread
- [ ] No secondary accent colors

### Typography
- [ ] Display headings use compressed tracking (`-0.025em` to `-0.035em`)
- [ ] At most one italic violet accent word per headline
- [ ] Body uses sans, leading 1.65–1.7, muted foreground
- [ ] Mono used only for labels, eyebrows, code, metadata — never body
- [ ] Eyebrows are uppercase, tracked (`0.22em+`), small (10–11px), muted

### Structure
- [ ] Every section opens with eyebrow (accent dot + mono label)
- [ ] Headline → lede → content rhythm is consistent
- [ ] One primary CTA per viewport (final CTA section exempted)
- [ ] Hairline dividers (if any) are short gradient fades, not 1px rules

### Anti-references
- [ ] No crypto signals (neon, 3D, space imagery, degen language)
- [ ] No generic-SaaS signals (3-column grid, stock photos, "empower")
- [ ] No traditional-banking signals (navy, handshakes, shield icons)

### Feel
- [ ] Reads as a precision instrument — not playful, not corporate, not crypto-bro
- [ ] Dense where it counts, open where it breathes
- [ ] A developer looks at it and thinks "real engineers built this"
- [ ] A CFO looks at it and thinks "these people are serious"
- [ ] Would Linear ship this?

### Copy
- [ ] No adjective-stacks ("revolutionary, powerful, secure")
- [ ] No boilerplate ("empower your business," "transform your workflow")
- [ ] Specific > generic everywhere (specific rails, specific countries, specific numbers)
- [ ] One italic accent word per headline carries the thesis

If **any** box doesn't check, revise before shipping.

## Rescue moves (when a design is off)

If a surface feels off but you can't pinpoint why, apply these in order:

1. **Count the violets.** If there are 4+ accent elements, remove until there are 2–3.
2. **Darken the surfaces.** If anything looks washed out, push toward `#0d0c17`-tinted.
3. **Tighten the headline.** Add negative tracking. One italic accent word, not two.
4. **Add an eyebrow.** If a section has no mono eyebrow label, add one.
5. **Cut the filler.** Delete any section that doesn't pass the "does this do work?" test.
6. **Look at it next to `bloque.app`.** Open the live site. If the new surface feels like a different brand, it is.

If after all five moves it still feels off, the foundation is wrong — start over from the scaffold (eyebrow → headline → content) rather than patching.
