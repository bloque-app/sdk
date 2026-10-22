---
"@bloque/sdk-accounts": minor
"@bloque/sdk-identity": minor
"@bloque/sdk": minor
"@bloque/cli": minor
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
  `externalUsBank.create` and `exchangePublicToken`. `us2.create` and
  `externalUsBank.create` ignored their options before; they now also send
  `idempotencyKey` as the `Idempotency-Key` header;
- `breb.createKey`, `activateKey`, `deleteKey`. These still return other
  errors as `{ error }`, but now throw the passkey-approval errors
  (`BloqueApprovalRequiredError`, `…InvalidError`, `…ExpiredError`,
  `…UnavailableError`) so the caller can wait for the approval;
- `identity.apiKeys.create` and `rotate`.

Freezing, disabling, suspending and renaming take no approval. New docs page:
Features → Passkey approvals (en, es).

MCP: `create_breb_key`, `activate_breb_key`, `delete_breb_key`,
`create_raw_card`, `activate_card`, `update_card_metadata`,
`create_polygon_account`, `create_virtual_account` and `rotate_api_key` go
through the same approval gate as the money-moving tools: a 428 returns
`approval_required` with the owner's `approvalUrl`, and `check_approval`
repeats the same request once approved.
