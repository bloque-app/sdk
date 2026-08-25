---
'@bloque/sdk-accounts': minor
'@bloque/cli': minor
---

Describe ledger accounts as they actually behave now

The backend changed how a virtual account gets its ledger (BQE-2175): creating one without a
`ledgerId` now mints the ledger account inline, so `ledgerId` comes back in the create response
instead of arriving later with a settlement. Nothing in the SDK's surface had caught up.

- `VirtualAccount` gains `ledgerAccountUrn` — the same ledger account under its URN rather than its
  address. `ledgerId` is the address; either can be used to look it up.
- `CreateAccountOptions.waitLedger` said it waits for the account to become active by polling every
  second. It polls every two, and what it waits for is the on-chain registration — not the
  `ledgerId`, which is already there. Only matters when the next thing you do is spend.
- `CreateVirtualAccountParams.ledgerId`, `VirtualAccount.ledgerId` and the `virtual.create()` docs
  now say when the account can receive versus send.
- `CreatePolygonAccountParams.ledgerId` claimed a ledger is "created automatically" if omitted,
  without mentioning that its id is not returned — so you could not share it. Says so now.
- MCP tool descriptions for `create_virtual_account`, `create_polygon_account`, `create_raw_card`
  and the `create_account` workflow updated to match, and the CLI README's tool counts corrected
  (14/26 → 15/37, with the missing BRE-B and API-key primitives listed).
