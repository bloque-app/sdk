---
"@bloque/sdk-accounts": patch
"@bloque/sdk": patch
"@bloque/cli": patch
---

`accounts.transfer()` now always sends a `metadata.reference`, the key that
makes a retried transfer land on the same operation instead of moving funds
twice. A caller-given `metadata.reference` is sent as-is; otherwise
`options.idempotencyKey` is used, and failing both the SDK generates one per
call and reuses it across its own automatic retries. The reference must be
unique per logical transfer and at most 128 bytes is safe; an `idempotencyKey`
used as the reference is subject to the same limit.

`ledgerId` on `accounts.virtual.create()` is deprecated: a virtual account
opens its own balance and can no longer be attached to an existing one.
Attach products (cards, Polygon accounts, …) to the virtual account by passing
its `ledgerId` instead. The parameter still exists; nothing breaks.

CLI: the `create_virtual_account` MCP tool's input schema no longer has
`ledgerId`, so MCP clients can no longer attach a new virtual account to an
existing balance through it.
