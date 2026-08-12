# @bloque/sdk-core

## 0.8.1

## 0.8.0

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

## 0.6.0

### Minor Changes

- Add self-service origin metadata update, closing the parity gap with the
  Kotlin SDK (`ApiKeysClient.updateOriginMetadata()`, v0.0.29+):

  - `identity.origins.updateMetadata({ originName, apiKey, metadata })` —
    patches an API-key origin's own presentation metadata (`company`,
    `tosGateShowHome`, `gateAccentColor`,
    `verificationGateReturnUrlAllowlist`), authenticated purely by the
    origin's own key in the request body. No session/JWT required, and it
    works even before you've ever called `connect()`/`register()`.
  - `bloque.origin.metadata({ metadata })` — a root-level convenience over the
    same call, sibling to `connect()`/`register()`, that defaults
    `originName`/`apiKey` to the SDK instance's own config.

  Both hit the new, more idiomatic `PATCH /api/origins/:origin_name/metadata`.
  The previous `PATCH /api/api-keys/origins/:origin_name/metadata` remains
  live, unchanged, on the server — it's what the already-published Kotlin SDK
  wraps — but new TypeScript callers should use one of the two methods above
  instead of calling either path directly.

## 0.5.0

## 0.4.1

## 0.4.0

### Minor Changes

- 861c7ab: Distinguish "under review" from "not submitted" in compliance gating.

  A customer who has already sent their documents or form answers used to
  get the same `BloqueVerificationRequiredError` as one who had sent
  nothing, so apps sent them back to the verification gate to submit
  what a reviewer was already holding.

  - New `BloqueVerificationPendingError` (`E_VERIFICATION_PENDING`, HTTP
    403), thrown when everything blocking the action is awaiting review.
    It deliberately has no `getVerificationLink()`: there is nothing left
    for the user to do, so retry the original action later instead.
  - `BloqueVerificationRequiredError` gains `pendingRequirements`, the
    subset of `missingRequirements` already submitted. What is actionable
    is the difference between the two.
  - `compliance.tiers.getStatus()` gains `pendingRequirements`, and each
    requirement gains the `'pending_review'` status plus `submittedAt`.
  - `compliance.verificationGate.init()` gains `pendingRequirements` and
    no longer lists an under-review requirement among the ones it asks the
    user to complete.

## 0.3.0

## 0.2.7

## 0.2.6

## 0.2.2

### Patch Changes

- ea6e6a6: Require `args.sourceAccountUrn` for RTP payout swap orders. Add Polygon→RTP and treasury guide examples. Update EN/ES swap reference docs.

## 0.1.11

### Patch Changes

- be8cbcb: Upgrade new fields for us-external accounts

## 0.1.10

### Patch Changes

- Added External US Account

## 0.1.10

## 0.1.2

### Patch Changes

- Upgrade internal versions

## 0.1.1

### Patch Changes

- Add logs and have a working version of the MCP
- 0a3b58a: new API keys security model.

## 0.1.0

## 0.0.23

### Patch Changes

- docs

## 0.0.20

### Patch Changes

- dummy

## 0.0.19

### Patch Changes

- adding method to list all origins

## 0.0.18

### Patch Changes

- adding methods to update card metadata and status

## 0.0.17

### Patch Changes

- dummy

## 0.0.16

### Patch Changes

- dummy

## 0.0.15

### Patch Changes

- dummy

## 0.0.14

### Patch Changes

- dummmy

## 0.0.13

### Patch Changes

- dummy

## 0.0.12

### Patch Changes

- dummy

## 0.0.11

### Patch Changes

- dummy

## 0.0.10

### Patch Changes

- dummy

## 0.0.6

### Patch Changes

- dummy

## 0.0.4

### Patch Changes

- dummy

## 0.0.3

### Patch Changes

- implementing client version
