---
"@bloque/sdk-core": minor
"@bloque/sdk-accounts": minor
"@bloque/sdk-compliance": minor
"@bloque/sdk-identity": minor
"@bloque/sdk-orgs": minor
"@bloque/sdk": minor
"@bloque/sdk-swap": minor
"@bloque/cli": minor
---

**BREAKING:** Consolidated self-service origin metadata update onto a single root-level method.

`identity.origins.updateMetadata()` (and its `OriginMetadataPatch`/`UpdateOriginMetadataResult` types) are removed from `@bloque/sdk-identity`. `bloque.origin.metadata()` is renamed to `bloque.origins.updateMetadata()` (plural `origins`) — same signature and behavior otherwise, still with `originName`/`apiKey` optional and defaulting to the SDK instance's own config:

```diff
- await bloque.identity.origins.updateMetadata({ originName, apiKey, metadata });
- await bloque.origin.metadata({ metadata });
+ await bloque.origins.updateMetadata({ metadata });
```

`OriginMetadataPatch` and `UpdateOriginMetadataResult` are now exported from `@bloque/sdk` (root) instead of `@bloque/sdk-identity`.

This SDK version also drops support for the legacy `PATCH /api/api-keys/origins/:origin_name/metadata` route, which has been removed server-side (payment-rails) in favor of `PATCH /api/origins/:origin_name/metadata` exclusively — there is no server-side fallback for the old path.
