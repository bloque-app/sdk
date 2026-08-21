---
"@bloque/cli": patch
---

Fix the CLI's MCP tools to match the v0.9.0 API contract sync: bank-transfer's `bankAccountType`/`bankAccountHolderIdentificationType` now use the corrected `checkings`/`PASSPORT` values, `create_breb_order` and `send_to_breb_key` now send the required `destinationKey`, and `get_profile` reads the identity profile defensively since its shape now varies by identity type.

BRE-B `keyType` is restricted to `ALPHA` — the only key type currently supported operationally for payouts.
