---
"@bloque/sdk-swap": patch
"@bloque/sdk-accounts": patch
"@bloque/cli": patch
---

BRE-B payouts no longer require a key type. `BrebDestinationKey.keyType` is optional and `key_type` is omitted from the request when absent; only `keyValue` is required. The resolved key's `keyType` from `resolveKey()` is typed as nullable, and the CLI BRE-B tools accept every key type, optionally.
