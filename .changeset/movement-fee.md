---
"@bloque/sdk-accounts": minor
"@bloque/sdk": minor
"@bloque/cli": minor
---

`accounts.movements()` and `accounts.transactions()` return `fee` (the total the customer paid on the order, in the asset the order delivers) on the movements of the operation that charged it, and `orderSig` (the order that produced the movement, also on its refund). Count `fee` once per `orderSig`; ignore it on a movement with direction `failed` or status `cancelled`, `failed` or `ignored`, or when the order has a refund (a separate movement with the same `orderSig` and no `fee`). `card.movements()` passes the API's `fee` and `details.order_sig` through. The CLI's MCP history tools show the fee in human units.

`direction` on movements and transactions now includes `'failed'`, which the API already returns with `collapsed_view`: a `switch` that is exhaustive over `'in' | 'out'` no longer type-checks.
