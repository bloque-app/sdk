# @bloque/sdk-accounts

## 0.13.0

### Minor Changes

- a6c6895: Add Base destinations for US bank ACH on-ramp and Base as a source for RTP payout.

  Kusama remains the default on every existing call. Opt in with `chain: 'base'` /
  `toMedium: 'base'` / `fromMedium: 'base'`:

  - `accounts.externalUsBank.pull()` — optional `chain` and `walletAddress` land USDC on Base at that 0x.
  - `swap.externalUsBank.create()` — `toMedium: 'base'` with `depositInformation.walletAddress` (optional `walletName`).
  - `swap.rtp.create()` — `fromMedium: 'base'` with `args.txHash` of the incoming USDC transfer; `args.sourceAccountUrn` is the EVM/Polygon account.

### Patch Changes

- @bloque/sdk-core@0.13.0

## 0.12.0

### Minor Changes

- aec7365: Add `delete()` to `CardClient`, `VirtualClient`, and `PolygonClient` — sends
  `DELETE /api/accounts/:urn`, mirroring `BrebClient.deleteKey()`. A "secondary"
  account (another account of the same owner shares the same underlying
  balance) is deleted immediately; a "primary" one still holding funds fails
  closed with `E_ACCOUNT_HAS_BALANCE` (409).

  `updateStatus()` on `CardClient`/`VirtualClient`/`PolygonClient` no longer
  types-accepts `'deleted'` as a status value — use the new `delete()` instead.

  Every request now also sends `X-Bloque-SDK: <name>@<version>` so the backend
  can tell an official-SDK caller from a direct API call (metadata only, not a
  trust boundary — a caller-supplied header of the same name wins, same as
  every other default header).

### Patch Changes

- Updated dependencies [aec7365]
  - @bloque/sdk-core@0.12.0

## 0.11.1

### Patch Changes

- @bloque/sdk-core@0.11.1

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

- @bloque/sdk-core@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [760a722]
  - @bloque/sdk-core@0.10.0

## 0.9.1

### Patch Changes

- @bloque/sdk-core@0.9.1

## 0.9.0

### Minor Changes

- c174591: Sync the SDK's types and clients with the current payment-rails API contract across accounts, compliance, identity, orgs, and swap.

  - **swap**: `swap.breb.create()` now requires `depositInformation.destinationKey` (`{ keyValue, keyType }`) for every BRE-B payout — `ALPHA` is currently the only operationally supported `keyType`. Fixed `BankAccountType`/`IdentificationType` enum values on bank-transfer inputs, and added `ExecutionHowCallback`/`ExecutionHowIframe` to the `execution.how` union.
  - **compliance**: `tosGate.init()` now returns a passkey WebAuthn challenge separately from `tosGate.challenge()`/`accept()` when the active TOS document requires account activation. Added `developerName` to verification-gate and tiers responses, `VerificationFlowRequestBody`/`requestBody`/`transactionalRedirect` to tiers, and KYB support plus `imageS3Key`/`downloadUrl`/`type`/`level`/`provider` fields to KYC.
  - **identity**: added `origins.attest()`/`origins.connect()`, `origins.updateMetadata()`, `apiKeys.upsertOriginWebhookSecret()`, and `dao`/`proxy`/`other` registration types. Widened `IdentityMe.profile` and fixed `AliasStatus`.
  - **orgs**: fixed `OrgType`/`OrgStatus`/`Place`/`OrgProfile.incorporationState` values and `invites.list()`'s response shape.
  - **accounts**: added physical card creation (`cardType`/`cardAddress`), card status reasons and PIN updates, and full spending-control/cashback/fee metadata (`SpendingControlMode`, `MccWhitelist`, `CashbackProgram`, `SpendingFee`) plus card webhook payload types. Added Polygon `fundingTx`/`openDeposits`, extended US account creation (transliterated names, government ID, proof of address, `sofEuQuestionnaire`), full `list()`/`balances()`/`transactions()` filter params, `BatchTransferResult.status`, and BRE-B `MOBILE` key type with structured `vat`/`inc` decoded-QR fields.

  Bancolombia was left untouched — it's deprecated and out of scope for this sync.

### Patch Changes

- @bloque/sdk-core@0.9.0

## 0.8.1

### Patch Changes

- @bloque/sdk-core@0.8.1

## 0.8.0

### Patch Changes

- @bloque/sdk-core@0.8.0

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
  - @bloque/sdk-core@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies
  - @bloque/sdk-core@0.6.0

## 0.5.0

### Patch Changes

- @bloque/sdk-core@0.5.0

## 0.4.1

### Patch Changes

- @bloque/sdk-core@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [861c7ab]
  - @bloque/sdk-core@0.4.0

## 0.3.0

### Minor Changes

- 77857ec: Add a typed `defaultAsset` param to `card.create()` and `card.updateMetadata()` for setting a card's primary settlement asset. Previously this could only be set informally via `metadata` with no canonical field name or validation (existing cards ended up with both `default_asset` and `preferredAsset` keys). `defaultAsset` is validated against `SupportedAsset` and written to `metadata.default_asset`; `CardAccount` now also exposes `defaultAsset` read back from the same field. `updateMetadata()`'s `metadata` param is now optional when `defaultAsset` is provided on its own.

### Patch Changes

- @bloque/sdk-core@0.3.0

## 0.2.7

### Patch Changes

- @bloque/sdk-core@0.2.7

## 0.2.6

### Patch Changes

- @bloque/sdk-core@0.2.6

## 0.2.2

### Patch Changes

- ea6e6a6: Require `args.sourceAccountUrn` for RTP payout swap orders. Add Polygon→RTP and treasury guide examples. Update EN/ES swap reference docs.
- Updated dependencies [ea6e6a6]
  - @bloque/sdk-core@0.2.2

## 0.1.11

### Patch Changes

- be8cbcb: Upgrade new fields for us-external accounts
- Updated dependencies [be8cbcb]
  - @bloque/sdk-core@0.1.11

## 0.1.10

### Patch Changes

- Added External US Account
- Updated dependencies
  - @bloque/sdk-core@0.1.10

## 0.1.10

### Patch Changes

- Added new feat external account
  - @bloque/sdk-core@0.1.10

## 0.1.2

### Patch Changes

- Upgrade internal versions
- Updated dependencies
  - @bloque/sdk-core@0.1.2

## 0.1.1

### Patch Changes

- Add logs and have a working version of the MCP
- 0a3b58a: new API keys security model.
- Updated dependencies
- Updated dependencies [0a3b58a]
  - @bloque/sdk-core@0.1.1

## 0.1.0

### Patch Changes

- @bloque/sdk-core@0.1.0

## 0.0.23

### Patch Changes

- docs
- Updated dependencies
  - @bloque/sdk-core@0.0.23

## 0.0.20

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.20

## 0.0.19

### Patch Changes

- adding method to list all origins
- Updated dependencies
  - @bloque/sdk-core@0.0.19

## 0.0.18

### Patch Changes

- adding methods to update card metadata and status
- Updated dependencies
  - @bloque/sdk-core@0.0.18

## 0.0.17

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.17

## 0.0.16

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.16

## 0.0.15

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.15

## 0.0.14

### Patch Changes

- dummmy
- Updated dependencies
  - @bloque/sdk-core@0.0.14

## 0.0.13

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.13

## 0.0.12

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.12

## 0.0.11

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.11

## 0.0.10

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.10

## 0.0.6

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.6

## 0.0.4

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-core@0.0.4

## 0.0.3

### Patch Changes

- implementing client version
- Updated dependencies
  - @bloque/sdk-core@0.0.3
