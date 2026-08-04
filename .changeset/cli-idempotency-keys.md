---
'@bloque/cli': patch
---

Add idempotency-key protection to all CLI write operations (transfers, card creation/funding, spending-category funding, and swap order creation: PSE, bank transfer, BRE-B). Each tool now accepts an optional `idempotencyKey` input; when omitted, a deterministic key is derived from the operation name and its parameters within a 5-minute window, so accidental retries (e.g. a transport-level retry) can no longer produce duplicate settled transactions.
