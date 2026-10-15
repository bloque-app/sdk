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
428. The new `check_approval` tool waits up to 45 seconds for the approval and
runs the exact same operation once approved, or reports `approval_expired` /
`approval_rejected`. Clients that send a progress token get the link as a
progress message and the original tool waits for the approval itself.
