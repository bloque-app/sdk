---
"@bloque/sdk-swap": minor
"@bloque/sdk": minor
---

Withdraw a USDC balance to a Polygon address (`kusama` → `polygon`, `BUSDC/6` → `USDC/6`) with one passkey approval:

- New `bloque.swap.polygon.withdraw()` moves the amount to the operator account. Its approval covers the account, the amount and the Polygon address, so wrap it in `withApproval`. It returns `withdrawalOp`.
- New `bloque.swap.polygon.create()` creates the order with that `withdrawalOp` as `args.withdrawalOp`. An order that matches the withdrawal (same account, amount and address, within 24 hours) needs no second approval. One withdrawal backs one order.

Both check the wallet address, the account and the amount before sending.
