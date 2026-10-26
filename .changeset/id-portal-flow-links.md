---
"@bloque/sdk-core": minor
"@bloque/sdk-identity": minor
"@bloque/sdk-accounts": minor
"@bloque/sdk": minor
---

Flow links for Bloque's identity portal (id.bloque.sh) and passkey approvals
over a full-page redirect:

- `identity.passkeys.createLink({ returnUrl })` returns a link where the
  signed-in person registers a passkey again (`POST /api/origins/passkeys/links`).
- Every method that takes `approval` also takes `approvalReturnUrl`, sent as
  `x-bloque-approval-return-url`, so the approval page sends the owner back.
- `BloqueApprovalRequiredError.toPendingApproval()` and
  `bloque.approvals.collect(pending)` finish an approved operation, once,
  after the owner comes back from a redirect.
- New errors: `BloqueApprovalPendingError`, `BloqueReturnUrlNotAllowedError`
  (also thrown by the BRE-B key methods) and
  `BloquePasskeyRegistrationUnavailableError` (`retryable`).
- A 503 whose body says `retryable: false` is no longer retried.
- `SDK_VERSION` reports the real package version again.
