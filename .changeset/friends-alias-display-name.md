---
"@bloque/sdk-identity": patch
"@bloque/sdk": patch
---

`identity.aliases.get()` now may return one additional optional field
on the alias record:

- `display_name?: string` — the recipient's display name, derived
  server-side from their KYC/KYB profile, when available. Use this to
  show who a transfer is actually going to before confirming.

Additive; existing consumers that ignore it are unaffected. Requires
compatible backend support.
