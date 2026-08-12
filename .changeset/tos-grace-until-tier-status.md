---
"@bloque/sdk-compliance": patch
"@bloque/sdk": patch
---

Surface ToS rollout grace on tier status:

- **`TierRequirementStatus.graceUntil`** — optional ISO-8601 cutoff when the
  `tos` requirement is `'satisfied'` only because of a policy
  `enforcement_starts_at` window. Lets clients prompt acceptance even while
  `missingRequirements` / `verificationFlow` stay quiet.
- **`TierStatus.nextRecomputeAt`** — optional ISO-8601 (or `null`) for the
  earliest instant the tier answer can change with no further input.
