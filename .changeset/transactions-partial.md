---
"@bloque/sdk-accounts": minor
"@bloque/sdk": minor
---

`accounts.transactions()` returns `partial` (and `partialAccounts` when it is `true`): some accounts' history from before the ledger re-founding could not be read for a moment, so the page lists only what was read for them. Retry from the first page for the full list.
