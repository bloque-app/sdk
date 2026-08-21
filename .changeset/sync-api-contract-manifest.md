---
"@bloque/sdk-accounts": minor
"@bloque/sdk-compliance": minor
"@bloque/sdk-identity": minor
"@bloque/sdk-orgs": minor
"@bloque/sdk-swap": minor
"@bloque/sdk": minor
---

Sync the SDK's types and clients with the current payment-rails API contract across accounts, compliance, identity, orgs, and swap.

- **swap**: `swap.breb.create()` now requires `depositInformation.destinationKey` (`{ keyValue, keyType }`) for every BRE-B payout — `ALPHA` is currently the only operationally supported `keyType`. Fixed `BankAccountType`/`IdentificationType` enum values on bank-transfer inputs, and added `ExecutionHowCallback`/`ExecutionHowIframe` to the `execution.how` union.
- **compliance**: `tosGate.init()` now returns a passkey WebAuthn challenge separately from `tosGate.challenge()`/`accept()` when the active TOS document requires account activation. Added `developerName` to verification-gate and tiers responses, `VerificationFlowRequestBody`/`requestBody`/`transactionalRedirect` to tiers, and KYB support plus `imageS3Key`/`downloadUrl`/`type`/`level`/`provider` fields to KYC.
- **identity**: added `origins.attest()`/`origins.connect()`, `origins.updateMetadata()`, `apiKeys.upsertOriginWebhookSecret()`, and `dao`/`proxy`/`other` registration types. Widened `IdentityMe.profile` and fixed `AliasStatus`.
- **orgs**: fixed `OrgType`/`OrgStatus`/`Place`/`OrgProfile.incorporationState` values and `invites.list()`'s response shape.
- **accounts**: added physical card creation (`cardType`/`cardAddress`), card status reasons and PIN updates, and full spending-control/cashback/fee metadata (`SpendingControlMode`, `MccWhitelist`, `CashbackProgram`, `SpendingFee`) plus card webhook payload types. Added Polygon `fundingTx`/`openDeposits`, extended US account creation (transliterated names, government ID, proof of address, `sofEuQuestionnaire`), full `list()`/`balances()`/`transactions()` filter params, `BatchTransferResult.status`, and BRE-B `MOBILE` key type with structured `vat`/`inc` decoded-QR fields.

Bancolombia was left untouched — it's deprecated and out of scope for this sync.
