# @bloque/cli

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
