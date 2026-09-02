---
'@bloque/sdk-accounts': minor
'@bloque/sdk-swap': minor
---

Add Base destinations for US bank ACH on-ramp and Base as a source for RTP payout.

Kusama remains the default on every existing call. Opt in with `chain: 'base'` /
`toMedium: 'base'` / `fromMedium: 'base'`:

- `accounts.externalUsBank.pull()` — optional `chain` and `walletAddress` land USDC on Base at that 0x.
- `swap.externalUsBank.create()` — `toMedium: 'base'` with `depositInformation.walletAddress` (optional `walletName`).
- `swap.rtp.create()` — `fromMedium: 'base'` with `args.txHash` of the incoming USDC transfer; `args.sourceAccountUrn` is the EVM/Polygon account.
