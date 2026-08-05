---
"@bloque/sdk-swap": minor
"@bloque/sdk-compliance": minor
"@bloque/sdk-identity": minor
"@bloque/sdk": minor
"@bloque/cli": patch
---

Sync three payment-rails API changes:

- **`swap.pse.create()`**: `args.redirectUrl` is now a **required** field on
  `PsePaymentArgs` — payment-rails rejects every PSE order missing
  `args.redirect_url` up front, regardless of the underlying bank gateway
  (Wompi or Cobre). This is a breaking type change for existing callers:
  add `redirectUrl` to your `args`.
- **`compliance.tosGate.init()`** now returns a `passkey` field — non-null
  when the active TOS document requires account activation (handing the
  identity's Kreivo PassAccount to a passkey). `compliance.tosGate.accept()`
  gained a matching `passkey` param (raw WebAuthn registration parts, as an
  alternative to `deviceAttestation`), and its result's `acceptance` now
  carries an optional `accountActivation` outcome. Both are purely additive
  — existing callers are unaffected.
- **`register()`/`connect(alias)`** (`originKey` auth) gained an optional
  `clientIp` option, forwarded as `x-original-client-ip` so payment-rails
  can resolve the end user's real usage country and audit compliance
  decisions against them instead of your server's own IP.
