---
"@bloque/sdk-compliance": minor
"@bloque/sdk-core": minor
"@bloque/sdk": minor
---

Distinguish "under review" from "not submitted" in compliance gating.

A customer who has already sent their documents or form answers used to
get the same `BloqueVerificationRequiredError` as one who had sent
nothing, so apps sent them back to the verification gate to submit
what a reviewer was already holding.

- New `BloqueVerificationPendingError` (`E_VERIFICATION_PENDING`, HTTP
  403), thrown when everything blocking the action is awaiting review.
  It deliberately has no `getVerificationLink()`: there is nothing left
  for the user to do, so retry the original action later instead.
- `BloqueVerificationRequiredError` gains `pendingRequirements`, the
  subset of `missingRequirements` already submitted. What is actionable
  is the difference between the two.
- `compliance.tiers.getStatus()` gains `pendingRequirements`, and each
  requirement gains the `'pending_review'` status plus `submittedAt`.
- `compliance.verificationGate.init()` gains `pendingRequirements` and
  no longer lists an under-review requirement among the ones it asks the
  user to complete.
