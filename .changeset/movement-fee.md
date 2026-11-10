---
"@bloque/sdk-accounts": minor
"@bloque/sdk": minor
---

`accounts.movements()` and `accounts.transactions()` return `fee` (the total the customer paid on the order, in the asset the order delivers) on the movement that charged it, and `orderSig` (the order that produced the movement, also on its refund). Count `fee` once per `orderSig`, and ignore it on a `failed` movement or when a refund with the same `orderSig` exists. `card.movements()` passes the API's `fee` and `details.order_sig` through.
