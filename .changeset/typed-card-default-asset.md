---
"@bloque/sdk-accounts": minor
---

Add a typed `defaultAsset` param to `card.create()` and `card.updateMetadata()` for setting a card's primary settlement asset. Previously this could only be set informally via `metadata` with no canonical field name or validation (existing cards ended up with both `default_asset` and `preferredAsset` keys). `defaultAsset` is validated against `SupportedAsset` and written to `metadata.default_asset`; `CardAccount` now also exposes `defaultAsset` read back from the same field. `updateMetadata()`'s `metadata` param is now optional when `defaultAsset` is provided on its own.
