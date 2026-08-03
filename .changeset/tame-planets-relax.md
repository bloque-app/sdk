---
"@bloque/sdk-compliance": minor
"@bloque/sdk": minor
---

Compliance requirement fields gain help text, localized select options, an upload opt-out, and a display title.

Backend policy authors can now enrich a requirement's form fields and
requirement-level presentation without an SDK consumer having to
hardcode raw key strings:

- New `LocalizedText` (`{ en, es }`) and `RequirementFieldOption`
  (`{ value, label: LocalizedText }`) types.
- `RequirementField` gains `description` (short help text rendered
  under the label) and `locale` (pins which language a field's own
  options display in, independent of the caller's locale detection).
  `RequirementField.options` now accepts `(string | RequirementFieldOption)[]`
  — existing plain-string options keep working unchanged.
- `TierRequirementStatus` (`compliance.tiers.getStatus()`) and
  `VerificationRequirement`/`PendingVerificationRequirement`
  (`compliance.verificationGate.init()`) gain `title`, a human-readable
  label for a requirement's card distinct from `description`.
  `TierRequirementStatus` also gains `requiresUpload`, mirroring the
  backend's per-requirement upload opt-out (`verificationGate.init()`
  already reflects this in its existing `uploadable` boolean, so it
  isn't duplicated as a separate field there).
- `TosGateInitResult` and `VerificationGateInitResult` gain
  `accentColor`, the calling origin's configured hosted-page brand
  color, for apps building their own UI around the gate instead of
  just opening the hosted `url`.

Not a breaking change: `RequirementField.options`'s widened type is a
superset of the old `string[]` — every existing caller that only reads
`options` as strings (or doesn't read it at all) keeps compiling and
behaving the same, since real-world policies keep emitting plain
strings for any option that isn't explicitly localized.
