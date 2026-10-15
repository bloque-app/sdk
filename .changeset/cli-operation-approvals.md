---
"@bloque/cli": minor
---

MCP tools now handle passkey operation approvals. Every tool that moves money
(`transfer`, `batch_transfer`, `fund_card`, `create_card` and
`create_disposable_card` funding, `create_account` and `add_spending_category`
funding, `create_pse_order`, `create_bank_transfer_order`, `create_breb_order`,
`topup_via_pse`, `cashout_to_bank`, `send_to_breb_key`) returns
`status: "approval_required"` with the `approvalUrl` to share with the account
owner, `expiresAt`, the approval `summary` and an `approvalId`, instead of a raw
428. The approval link is for the owner to open and approve with their own
passkey; tool descriptions tell agents never to open or approve it themselves.

The new `check_approval` tool waits up to 45 seconds for the approval and runs
the exact same operation once approved, or reports `approval_expired` /
`approval_rejected`. It sends an approved operation at most once: a check while
it is in flight waits for it or answers `in_progress`, a check after it finished
returns the same result, and an approved request whose reply was lost reports
`failed` with advice to check the account's movements rather than repeat it.
Workflows that create a card or account and then fund it point an expired or
rejected funding approval at the funding step only. Clients that send a progress
token get the link as a progress message and the original tool waits for the
approval itself.
