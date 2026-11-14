---
"@bloque/sdk-swap": minor
"@bloque/sdk": minor
---

New `bloque.swap.polygon.create()` withdraws a USDC balance to a Polygon address (`kusama` → `polygon`, `BUSDC/6` → `USDC/6`). The owner approves it with their passkey, so wrap it in `withApproval`. The SDK checks the wallet address and the source account before sending the order.
