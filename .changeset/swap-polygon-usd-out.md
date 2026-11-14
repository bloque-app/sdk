---
"@bloque/sdk-swap": minor
"@bloque/sdk": minor
---

New `bloque.swap.polygon.create()` withdraws a USDC balance to a Polygon address (`kusama` → `polygon`, `BUSDC/6` → `USDC/6`). The owner approves it with their passkey, so wrap it in `withApproval`. First withdraw the balance to the operator account and approve that withdrawal with your passkey, then pass its operation reference as `args.withdrawalOp`; one withdrawal backs one order. The SDK checks the wallet address, the source account and the operation reference before sending the order.
