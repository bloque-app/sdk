---
"@bloque/sdk-identity": patch
"@bloque/sdk": patch
---

`identity.aliases.get()` now may return two additional optional fields
on the alias record:

- `account_urn?: string` — the destination account URN resolved
  server-side for that identity, when one could be determined. Pass
  this directly as the transfer destination instead of the identity
  URN.
- `account_resolution_error?: "NO_ACCOUNT"` — present only when no
  destination account could be resolved for that identity.

Both fields are additive; existing consumers that ignore them are
unaffected. Requires payment-rails PR #975 to be deployed for the
fields to actually be populated by the API.
