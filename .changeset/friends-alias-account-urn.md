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
- `account_resolution_error?: "NO_ACCOUNT" | "RESOLUTION_UNAVAILABLE"` —
  distinguishes an identity without a receiving account from a temporary
  resolution failure.

`identity.myAliases()` and `identity.getAliases()` now expose the alias fields
returned by the API, including `status`, `is_primary`, `is_public`, `urn`, and
`origin`. The legacy `verified` and `primary` fields remain optional and
deprecated.

Both fields are additive; existing consumers that ignore them are
unaffected. The account fields require compatible backend support.
