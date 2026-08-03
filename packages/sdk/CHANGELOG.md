# @bloque/sdk

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

- Updated dependencies [f043b1b]
  - @bloque/sdk-compliance@0.4.1
  - @bloque/sdk-identity@0.4.1
  - @bloque/sdk-core@0.4.1
  - @bloque/sdk-accounts@0.4.1
  - @bloque/sdk-orgs@0.4.1
  - @bloque/sdk-swap@0.4.1

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
  - @bloque/sdk-compliance@0.4.0
  - @bloque/sdk-core@0.4.0
  - @bloque/sdk-accounts@0.4.0
  - @bloque/sdk-identity@0.4.0
  - @bloque/sdk-orgs@0.4.0
  - @bloque/sdk-swap@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [77857ec]
  - @bloque/sdk-accounts@0.3.0
  - @bloque/sdk-core@0.3.0
  - @bloque/sdk-compliance@0.3.0
  - @bloque/sdk-identity@0.3.0
  - @bloque/sdk-orgs@0.3.0
  - @bloque/sdk-swap@0.3.0

## 0.2.7

### Patch Changes

- @bloque/sdk-core@0.2.7
- @bloque/sdk-accounts@0.2.7
- @bloque/sdk-compliance@0.2.7
- @bloque/sdk-identity@0.2.7
- @bloque/sdk-orgs@0.2.7
- @bloque/sdk-swap@0.2.7

## 0.2.6

### Patch Changes

- @bloque/sdk-core@0.2.6
- @bloque/sdk-accounts@0.2.6
- @bloque/sdk-compliance@0.2.6
- @bloque/sdk-identity@0.2.6
- @bloque/sdk-orgs@0.2.6
- @bloque/sdk-swap@0.2.6

## 0.2.2

### Patch Changes

- ea6e6a6: Require `args.sourceAccountUrn` for RTP payout swap orders. Add Polygon→RTP and treasury guide examples. Update EN/ES swap reference docs.
- Updated dependencies [ea6e6a6]
  - @bloque/sdk-core@0.2.2
  - @bloque/sdk-accounts@0.2.2
  - @bloque/sdk-compliance@0.2.2
  - @bloque/sdk-identity@0.2.2
  - @bloque/sdk-orgs@0.2.2
  - @bloque/sdk-swap@0.2.2

## 0.1.11

### Patch Changes

- be8cbcb: Upgrade new fields for us-external accounts
- Updated dependencies [be8cbcb]
  - @bloque/sdk-accounts@0.1.11
  - @bloque/sdk-core@0.1.11
  - @bloque/sdk-compliance@0.1.11
  - @bloque/sdk-identity@0.1.11
  - @bloque/sdk-orgs@0.1.11
  - @bloque/sdk-swap@0.1.11

## 0.1.10

### Patch Changes

- Added External US Account
- Updated dependencies
  - @bloque/sdk-compliance@0.1.10
  - @bloque/sdk-accounts@0.1.10
  - @bloque/sdk-identity@0.1.10
  - @bloque/sdk-core@0.1.10
  - @bloque/sdk-orgs@0.1.10
  - @bloque/sdk-swap@0.1.10

## 0.1.10

### Patch Changes

- Updated dependencies
  - @bloque/sdk-accounts@0.1.10
  - @bloque/sdk-core@0.1.10
  - @bloque/sdk-compliance@0.1.10
  - @bloque/sdk-identity@0.1.10
  - @bloque/sdk-orgs@0.1.10
  - @bloque/sdk-swap@0.1.10

## 0.1.2

### Patch Changes

- Upgrade internal versions
- Updated dependencies
  - @bloque/sdk-accounts@0.1.2
  - @bloque/sdk-compliance@0.1.2
  - @bloque/sdk-core@0.1.2
  - @bloque/sdk-identity@0.1.2
  - @bloque/sdk-orgs@0.1.2
  - @bloque/sdk-swap@0.1.2

## 0.1.1

### Patch Changes

- Add logs and have a working version of the MCP
- 0a3b58a: new API keys security model.
- Updated dependencies
- Updated dependencies [0a3b58a]
  - @bloque/sdk-accounts@0.1.1
  - @bloque/sdk-compliance@0.1.1
  - @bloque/sdk-core@0.1.1
  - @bloque/sdk-identity@0.1.1
  - @bloque/sdk-orgs@0.1.1
  - @bloque/sdk-swap@0.1.1

## 0.1.0

### Patch Changes

- @bloque/sdk-core@0.1.0
- @bloque/sdk-accounts@0.1.0
- @bloque/sdk-compliance@0.1.0
- @bloque/sdk-identity@0.1.0
- @bloque/sdk-orgs@0.1.0
- @bloque/sdk-swap@0.1.0

## 0.0.23

### Patch Changes

- docs
- Updated dependencies
  - @bloque/sdk-accounts@0.0.23
  - @bloque/sdk-compliance@0.0.23
  - @bloque/sdk-core@0.0.23
  - @bloque/sdk-identity@0.0.23
  - @bloque/sdk-orgs@0.0.23

## 0.0.20

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-accounts@0.0.20
  - @bloque/sdk-compliance@0.0.20
  - @bloque/sdk-core@0.0.20
  - @bloque/sdk-identity@0.0.20
  - @bloque/sdk-orgs@0.0.20

## 0.0.19

### Patch Changes

- adding method to list all origins
- Updated dependencies
  - @bloque/sdk-accounts@0.0.19
  - @bloque/sdk-compliance@0.0.19
  - @bloque/sdk-core@0.0.19
  - @bloque/sdk-identity@0.0.19
  - @bloque/sdk-orgs@0.0.19

## 0.0.18

### Patch Changes

- adding methods to update card metadata and status
- Updated dependencies
  - @bloque/sdk-accounts@0.0.18
  - @bloque/sdk-compliance@0.0.18
  - @bloque/sdk-core@0.0.18
  - @bloque/sdk-identity@0.0.18
  - @bloque/sdk-orgs@0.0.18

## 0.0.17

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-accounts@0.0.17
  - @bloque/sdk-compliance@0.0.17
  - @bloque/sdk-core@0.0.17
  - @bloque/sdk-identity@0.0.17
  - @bloque/sdk-orgs@0.0.17

## 0.0.16

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-compliance@0.0.16
  - @bloque/sdk-accounts@0.0.16
  - @bloque/sdk-identity@0.0.16
  - @bloque/sdk-core@0.0.16
  - @bloque/sdk-orgs@0.0.16

## 0.0.15

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-compliance@0.0.15
  - @bloque/sdk-accounts@0.0.15
  - @bloque/sdk-identity@0.0.15
  - @bloque/sdk-orgs@0.0.15
  - @bloque/sdk-core@0.0.15

## 0.0.14

### Patch Changes

- dummmy
- Updated dependencies
  - @bloque/sdk-accounts@0.0.14
  - @bloque/sdk-compliance@0.0.14
  - @bloque/sdk-core@0.0.14
  - @bloque/sdk-identity@0.0.14
  - @bloque/sdk-orgs@0.0.14

## 0.0.13

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-compliance@0.0.13
  - @bloque/sdk-accounts@0.0.13
  - @bloque/sdk-identity@0.0.13
  - @bloque/sdk-core@0.0.13
  - @bloque/sdk-orgs@0.0.13

## 0.0.12

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-accounts@0.0.12
  - @bloque/sdk-compliance@0.0.12
  - @bloque/sdk-core@0.0.12
  - @bloque/sdk-identity@0.0.12
  - @bloque/sdk-orgs@0.0.12

## 0.0.11

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-accounts@0.0.11
  - @bloque/sdk-compliance@0.0.11
  - @bloque/sdk-core@0.0.11
  - @bloque/sdk-identity@0.0.11
  - @bloque/sdk-orgs@0.0.11

## 0.0.10

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-compliance@0.0.10
  - @bloque/sdk-accounts@0.0.10
  - @bloque/sdk-identity@0.0.10
  - @bloque/sdk-core@0.0.10
  - @bloque/sdk-orgs@0.0.10

## 0.0.6

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-compliance@0.0.6
  - @bloque/sdk-accounts@0.0.6
  - @bloque/sdk-identity@0.0.6
  - @bloque/sdk-core@0.0.6
  - @bloque/sdk-orgs@0.0.6

## 0.0.4

### Patch Changes

- dummy
- Updated dependencies
  - @bloque/sdk-accounts@0.0.4
  - @bloque/sdk-compliance@0.0.4
  - @bloque/sdk-core@0.0.4
  - @bloque/sdk-identity@0.0.4
  - @bloque/sdk-orgs@0.0.4

## 0.0.3

### Patch Changes

- implementing client version
- Updated dependencies
  - @bloque/sdk-accounts@0.0.3
  - @bloque/sdk-compliance@0.0.3
  - @bloque/sdk-core@0.0.3
  - @bloque/sdk-identity@0.0.3
  - @bloque/sdk-orgs@0.0.3
