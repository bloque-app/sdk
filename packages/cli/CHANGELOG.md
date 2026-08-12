# @bloque/cli

## 0.8.1

### Patch Changes

- Updated dependencies [87fbca3]
  - @bloque/sdk@0.8.1

## 0.8.0

### Patch Changes

- afd8192: Sync three payment-rails API changes:

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

- Updated dependencies [afd8192]
  - @bloque/sdk@0.8.0

## 0.7.0

### Minor Changes

- 9cc9d84: **BREAKING:** Consolidated self-service origin metadata update onto a single root-level method.

  `identity.origins.updateMetadata()` (and its `OriginMetadataPatch`/`UpdateOriginMetadataResult` types) are removed from `@bloque/sdk-identity`. `bloque.origin.metadata()` is renamed to `bloque.origins.updateMetadata()` (plural `origins`) — same signature and behavior otherwise, still with `originName`/`apiKey` optional and defaulting to the SDK instance's own config:

  ```diff
  - await bloque.identity.origins.updateMetadata({ originName, apiKey, metadata });
  - await bloque.origin.metadata({ metadata });
  + await bloque.origins.updateMetadata({ metadata });
  ```

  `OriginMetadataPatch` and `UpdateOriginMetadataResult` are now exported from `@bloque/sdk` (root) instead of `@bloque/sdk-identity`.

  This SDK version also drops support for the legacy `PATCH /api/api-keys/origins/:origin_name/metadata` route, which has been removed server-side (payment-rails) in favor of `PATCH /api/origins/:origin_name/metadata` exclusively — there is no server-side fallback for the old path.

### Patch Changes

- Updated dependencies [9cc9d84]
  - @bloque/sdk@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies
  - @bloque/sdk@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [3fa49c2]
  - @bloque/sdk@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies [f043b1b]
  - @bloque/sdk@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [861c7ab]
  - @bloque/sdk@0.4.0

## 0.3.0

### Patch Changes

- @bloque/sdk@0.3.0

## 0.2.7

### Patch Changes

- Fix `@bloque/cli` typecheck drift against tightened `SupportedAsset`/`SupportedBank` types in `@bloque/sdk-core`/`@bloque/sdk-swap`. No behavior change — casts and type narrowing only, backed by the SDK's existing runtime validation. This unblocks the `cli-v0.2.6` release, which failed before publishing anything.
  - @bloque/sdk@0.2.7

## 0.2.6

### Patch Changes

- Fix `send_to_breb_key` MCP tool sending a malformed `COPM` asset ticker (missing the `/2` precision suffix) to `findRates`, which caused every COPM BRE-B cash-out to fail with "No exchange rates available" before an order was ever created.
  - @bloque/sdk@0.2.6

## 0.2.2

### Patch Changes

- ea6e6a6: Require `args.sourceAccountUrn` for RTP payout swap orders. Add Polygon→RTP and treasury guide examples. Update EN/ES swap reference docs.
- Updated dependencies [ea6e6a6]
  - @bloque/sdk@0.2.2

## 0.1.11

### Patch Changes

- Updated dependencies [be8cbcb]
  - @bloque/sdk@0.1.11

## 0.1.10

### Patch Changes

- Updated dependencies
  - @bloque/sdk@0.1.10

## 0.1.10

### Patch Changes

- @bloque/sdk@0.1.10

## 0.1.2

### Patch Changes

- Upgrade internal versions
- Updated dependencies
  - @bloque/sdk@0.1.2

## 0.1.1

### Patch Changes

- Add logs and have a working version of the MCP
- 0a3b58a: new API keys security model.
- Updated dependencies
- Updated dependencies [0a3b58a]
  - @bloque/sdk@0.1.1

## 0.1.0

### Minor Changes

- d50206d: Add card-to-website binding for AI agents

  - New tool `resolve_card_for_website`: find which card to use for a given website by matching `allowed_websites` in card metadata. Returns all active matches with balances.
  - New tool `assign_card_to_website`: associate a card with one or more domains. Supports merge (append) and replace modes. Preserves existing metadata fields.
  - `create_card` and `create_disposable_card` now accept an optional `websites` parameter to tag cards with domains at creation time.
  - Session file permissions restricted to owner-only (`0600`) for improved credential security.

### Patch Changes

- @bloque/sdk@0.1.0
