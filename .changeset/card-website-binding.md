---
"@bloque/cli": minor
---

Add card-to-website binding for AI agents

- New tool `resolve_card_for_website`: find which card to use for a given website by matching `allowed_websites` in card metadata. Returns all active matches with balances.
- New tool `assign_card_to_website`: associate a card with one or more domains. Supports merge (append) and replace modes. Preserves existing metadata fields.
- `create_card` and `create_disposable_card` now accept an optional `websites` parameter to tag cards with domains at creation time.
- Session file permissions restricted to owner-only (`0600`) for improved credential security.
