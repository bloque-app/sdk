# @bloque/sdk-identity

## 0.13.0

### Patch Changes

- @bloque/sdk-core@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [aec7365]
  - @bloque/sdk-core@0.12.0

## 0.11.1

### Patch Changes

- @bloque/sdk-core@0.11.1

## 0.11.0

### Patch Changes

- @bloque/sdk-core@0.11.0

## 0.10.0

### Minor Changes

- 760a722: Add origin-operator credentials for tenant customer-service:

  - **`orgs.createOrigin(orgUrn, { namespace })`** — user JWT + KYB-active org
    with `orgs.write`. Creates an api-key origin, binds this org, seeds
    origin-cs roles, returns `originApiKey` once.
  - **`orgs.assumeOrigin(namespace)`** — human user JWT in, 15-minute
    `kind: origin-operator` JWT out. Session switches so subsequent
    `apiKeys.create` mints origin-bound keys (`bound_origin` set). Org-admin
    scopes, `*.read.any`, pay/create/transfers, and passkey-as-user are not
    part of this token.
  - **`apiKeys.exchange({ key, scopes?, asIdentity })`** — `{ key }` stays
    unauthenticated discovery; `{ key, asIdentity }` sends `as_identity` and
    forwards the current origin-operator Bearer. Cross-origin URNs are 404;
    unbound keys reject `asIdentity` with `400 E_AS_IDENTITY_NOT_ALLOWED`.
  - **`compliance.kyc.startVerification({ urn })`** — KYC vs KYB is derived
    by the backend from the URN (`did:bloque:orgs:{id}` → KYB). Do not pass
    `type`.

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

### Patch Changes

- Updated dependencies
  - @bloque/sdk-core@0.6.0

## 0.5.0

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

- Added identity registration support with `origins.register()` method
  - Individual user registration (KYC) with complete profile fields
  - Business registration (KYB) with company and beneficial owner information
  - Support for multiple authentication methods: SIGNING_CHALLENGE, API_KEY, OAUTH_REDIRECT, WEBAUTHN, OTP, PASSWORD
  - New types: `RegisterParams`, `IndividualRegisterParams`, `BusinessRegisterParams`, `RegisterResult`, `UserProfile`, `BusinessProfile`
  - Cross-origin registration capabilities for blockchain, OAuth, and custom providers
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
