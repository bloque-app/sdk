---
"@bloque/sdk-core": minor
"@bloque/sdk-accounts": minor
"@bloque/sdk-swap": minor
"@bloque/sdk": minor
---

Passkey operation approvals. When a money-moving operation needs the account
owner's passkey approval, the SDK now throws `BloqueApprovalRequiredError`
(428) with `approvalUrl`, `summary` and `expiresAt`. `waitForApproval()` polls
for the owner's signature until `expiresAt`, and the operation is repeated
with the new `approval` option (`x-bloque-operation-approval` header) on
`accounts.transfer`, `accounts.batchTransfer`, `accounts.externalUsBank.pull`
and every swap order `create` / `createDeposit`. `withApproval()` wraps the
whole flow with a single repeat. The approval token never reaches logs:
`approvalUrl` is non-enumerable and `toJSON()` / `error.response` drop it.

The other approval errors are typed too: `BloqueApprovalInvalidError`
(`reason`, e.g. `passkey_rejected`, `passkey_not_registered`),
`BloqueApprovalExpiredError`, `BloqueApprovalUnavailableError`,
`BloqueApprovalArgsRequiredError` (`args`),
`BloqueApprovalMultipleOwnersError` and `BloqueApprovalAccountsNotReadyError`.

A 429 or 503 that is still failing after the SDK's automatic retries now
reaches the caller with its own type (e.g. `BloqueRateLimitError`,
`BloqueTierLimitExceededError`, `BloqueApprovalUnavailableError`) instead of
being wrapped in `BloqueNetworkError`.
