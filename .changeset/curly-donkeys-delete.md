---
"@bloque/sdk-core": minor
"@bloque/sdk-accounts": minor
"@bloque/sdk": minor
---

Add `delete()` to `CardClient`, `VirtualClient`, and `PolygonClient` — sends
`DELETE /api/accounts/:urn`, mirroring `BrebClient.deleteKey()`. A "secondary"
account (another account of the same owner shares the same underlying
balance) is deleted immediately; a "primary" one still holding funds fails
closed with `E_ACCOUNT_HAS_BALANCE` (409).

`updateStatus()` on `CardClient`/`VirtualClient`/`PolygonClient` no longer
types-accepts `'deleted'` as a status value — use the new `delete()` instead.

Every request now also sends `X-Bloque-SDK: <name>@<version>` so the backend
can tell an official-SDK caller from a direct API call (metadata only, not a
trust boundary — a caller-supplied header of the same name wins, same as
every other default header).
