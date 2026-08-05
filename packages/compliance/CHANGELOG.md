# @bloque/sdk-compliance

## 0.8.0

### Minor Changes

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

### Minor Changes

- 3fa49c2: Compliance requirement fields gain help text, localized select options, an upload opt-out, and a display title.

  Backend policy authors can now enrich a requirement's form fields and
  requirement-level presentation without an SDK consumer having to
  hardcode raw key strings:

  - New `LocalizedText` (`{ en, es }`) and `RequirementFieldOption`
    (`{ value, label: LocalizedText }`) types.
  - `RequirementField` gains `description` (short help text rendered
    under the label) and `locale` (pins which language a field's own
    options display in, independent of the caller's locale detection).
    `RequirementField.options` now accepts `(string | RequirementFieldOption)[]`
    — existing plain-string options keep working unchanged.
  - `TierRequirementStatus` (`compliance.tiers.getStatus()`) and
    `VerificationRequirement`/`PendingVerificationRequirement`
    (`compliance.verificationGate.init()`) gain `title`, a human-readable
    label for a requirement's card distinct from `description`.
    `TierRequirementStatus` also gains `requiresUpload`, mirroring the
    backend's per-requirement upload opt-out (`verificationGate.init()`
    already reflects this in its existing `uploadable` boolean, so it
    isn't duplicated as a separate field there).
  - `TosGateInitResult` and `VerificationGateInitResult` gain
    `accentColor`, the calling origin's configured hosted-page brand
    color, for apps building their own UI around the gate instead of
    just opening the hosted `url`.

  Not a breaking change: `RequirementField.options`'s widened type is a
  superset of the old `string[]` — every existing caller that only reads
  `options` as strings (or doesn't read it at all) keeps compiling and
  behaving the same, since real-world policies keep emitting plain
  strings for any option that isn't explicitly localized.

### Patch Changes

- @bloque/sdk-core@0.5.0

## 0.4.1

### Patch Changes

- f043b1b: Document two origins-service behavior changes that don't alter wire
  shapes but do change what callers should expect:

  - `compliance.verificationGate.start()`'s `returnUrl` is now validated
    fail-closed against the union of the calling origin's own
    `metadata.verification_gate_return_url_allowlist` (if configured) and
    the deployment-wide `VERIFICATION_GATE_RETURN_URL_ALLOWLIST` env var,
    rather than the env var alone. Either allowlist being satisfied is
    enough.
  - `identity.origins.list()` — a public, unauthenticated endpoint — now
    always returns `metadata: {}` regardless of what's actually stored on
    the origin, since that field has held secrets and commercially
    sensitive terms for unrelated internal purposes. Don't rely on it for
    origin presentation data.
  - @bloque/sdk-core@0.4.1

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

### Patch Changes

- Updated dependencies [861c7ab]
  - @bloque/sdk-core@0.4.0

## 0.3.0

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

- Updated dependencies [be8cbcb]
  - @bloque/sdk-core@0.1.11

## 0.1.10

### Patch Changes

- Added External US Account
- Updated dependencies
  - @bloque/sdk-core@0.1.10

## 0.1.10

### Patch Changes

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
