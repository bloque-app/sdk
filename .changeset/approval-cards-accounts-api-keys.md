---
"@bloque/sdk-accounts": minor
"@bloque/sdk-identity": minor
"@bloque/sdk": minor
---

Card, account, BRE-B key and API-key methods now take the account owner's
passkey `approval`, sent as `x-bloque-operation-approval` the same way
`transfer` does, so a call the API refuses with `BloqueApprovalRequiredError`
(428 `E_APPROVAL_REQUIRED`) can be repeated with it (`withApproval` works for
all of them):

- `card.create`, `activate`, `updateStatus`, `update`, `updateMetadata`,
  `tokenizeApple`, `tokenizeGoogle`, `delete`;
- `create` (via `CreateAccountOptions`), `updateMetadata`, `activate` and
  `delete` on the other account clients, `us2.create`,
  `externalUsBank.create` and `exchangePublicToken`;
- `breb.createKey`, `activateKey`, `deleteKey`. These return other errors as
  `{ error }`, but now throw `BloqueApprovalRequiredError` so the caller can
  wait for the approval;
- `apiKeys.create` and `rotate`.

Freezing, disabling, suspending and renaming take no approval. New docs page:
Features → Passkey approvals (en, es).
