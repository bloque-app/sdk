---
"@bloque/sdk-compliance": patch
"@bloque/sdk-identity": patch
"@bloque/sdk": patch
---

Document two origins-service behavior changes that don't alter wire
shapes but do change what callers should expect:

- `compliance.verificationGate.start()`'s `returnUrl` is now validated
  fail-closed against the union of the calling origin's own
  `metadata.verification_gate_return_url_allowlist` (if configured) and
  the deployment-wide `VERIFICATION_GATE_RETURN_URL_ALLOWLIST` env var,
  rather than the env var alone. Either allowlist being satisfied is
  enough.
- `identity.origins.list()` — a public, unauthenticated endpoint — now
  always returns `metadata: {}` regardless of what's actually stored on
  the origin, since that field has held secrets and commercially
  sensitive terms for unrelated internal purposes. Don't rely on it for
  origin presentation data.
