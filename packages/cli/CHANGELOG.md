# @bloque/cli

## 0.17.0

### Minor Changes

- 3bdfca3: MCP tools now handle passkey operation approvals. Every tool that moves money
  (`transfer`, `batch_transfer`, `fund_card`, `create_card` and
  `create_disposable_card` funding, `create_account` and `add_spending_category`
  funding, `create_pse_order`, `create_bank_transfer_order`, `create_breb_order`,
  `topup_via_pse`, `cashout_to_bank`, `send_to_breb_key`) returns
  `status: "approval_required"` with the `approvalUrl` to share with the account
  owner, `expiresAt`, the approval `summary` and an `approvalId`, instead of a raw 428. The approval link is for the owner to open and approve with their own
  passkey; tool descriptions tell agents never to open or approve it themselves.

  The new `check_approval` tool waits up to 45 seconds for the approval and runs
  the exact same operation once approved, or reports `approval_expired` /
  `approval_rejected`. It sends an approved operation at most once: a check while
  it is in flight waits for it or answers `in_progress`, a check after it finished
  returns the same result, and an approved request whose reply was lost reports
  `failed` with advice to check the account's movements rather than repeat it.
  Workflows that create a card or account and then fund it point an expired or
  rejected funding approval at the funding step only. Clients that send a progress
  token get the link as a progress message and the original tool waits for the
  approval itself.

### Patch Changes

- Updated dependencies [6451a8d]
  - @bloque/sdk@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [3c07050]
  - @bloque/sdk@0.16.0

## 0.15.1

### Patch Changes

- 742eb3a: BRE-B payouts no longer require a key type. `BrebDestinationKey.keyType` is optional (and accepts `null`) and `key_type` is omitted from the request when absent; only `keyValue` is required. The resolved key's `keyType` from `resolveKey()` is typed as nullable — it can be passed straight into `destinationKey`. The CLI BRE-B tools accept every key type, optionally.
  - @bloque/sdk@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [7bab7eb]
  - @bloque/sdk@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [70dae18]
  - @bloque/sdk@0.14.0

## 0.13.4

### Patch Changes

- 6ec8342: `accounts.transfer()` now always sends a `metadata.reference`, the key that
  makes a retried transfer land on the same operation instead of moving funds
  twice. A caller-given `metadata.reference` is sent as-is; otherwise
  `options.idempotencyKey` is used, and failing both the SDK generates one per
  call and reuses it across its own automatic retries. The reference must be
  unique per logical transfer and at most 128 bytes is safe; an `idempotencyKey`
  used as the reference is subject to the same limit.

  `ledgerId` on `accounts.virtual.create()` is deprecated: a virtual account
  opens its own balance and can no longer be attached to an existing one.
  Attach products (cards, Polygon accounts, …) to the virtual account by passing
  its `ledgerId` instead. The parameter still exists; nothing breaks.

  CLI: the `create_virtual_account` MCP tool's input schema no longer has
  `ledgerId`, so MCP clients can no longer attach a new virtual account to an
  existing balance through it.

- Updated dependencies [6ec8342]
  - @bloque/sdk@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [9621d2d]
  - @bloque/sdk@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [1c30aa5]
  - @bloque/sdk@0.13.2

## 0.13.1

### Patch Changes

- @bloque/sdk@0.13.1

## 0.13.0

### Patch Changes

- @bloque/sdk@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [aec7365]
  - @bloque/sdk@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [b345b14]
  - @bloque/sdk@0.11.1

## 0.11.0

### Minor Changes

- cd490a2: Describe ledger accounts as they actually behave now

  The backend changed how a virtual account gets its ledger (BQE-2175): creating one without a
  `ledgerId` now mints the ledger account inline, so `ledgerId` comes back in the create response
  instead of arriving later with a settlement. Nothing in the SDK's surface had caught up.

  - `VirtualAccount` gains `ledgerAccountUrn` — the same ledger account under its URN rather than its
    address. `ledgerId` is the address; either can be used to look it up.
  - `CreateAccountOptions.waitLedger` said it waits for the account to become active by polling every
    second. It polls every two, and what it waits for is the on-chain registration — not the
    `ledgerId`, which is already there. Only matters when the next thing you do is spend.
  - `CreateVirtualAccountParams.ledgerId`, `VirtualAccount.ledgerId` and the `virtual.create()` docs
    now say when the account can receive versus send.
  - `CreatePolygonAccountParams.ledgerId` claimed a ledger is "created automatically" if omitted,
    without mentioning that its id is not returned — so you could not share it. Says so now.
  - MCP tool descriptions for `create_virtual_account`, `create_polygon_account`, `create_raw_card`
    and the `create_account` workflow updated to match, and the CLI README's tool counts corrected
    (14/26 → 15/37, with the missing BRE-B and API-key primitives listed).

### Patch Changes

- @bloque/sdk@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [760a722]
  - @bloque/sdk@0.10.0

## 0.9.1

### Patch Changes

- 90b236e: Fix the CLI's MCP tools to match the v0.9.0 API contract sync: bank-transfer's `bankAccountType`/`bankAccountHolderIdentificationType` now use the corrected `checkings`/`PASSPORT` values, `create_breb_order` and `send_to_breb_key` now send the required `destinationKey`, and `get_profile` reads the identity profile defensively since its shape now varies by identity type.

  BRE-B `keyType` is restricted to `ALPHA` — the only key type currently supported operationally for payouts.

  - @bloque/sdk@0.9.1

## 0.9.0

### Patch Changes

- Updated dependencies [c174591]
  - @bloque/sdk@0.9.0

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
