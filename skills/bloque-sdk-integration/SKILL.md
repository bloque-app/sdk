---
name: bloque-sdk-integration
description: >
  Integration guide for the Bloque SDK — a TypeScript SDK for programmable
  financial accounts, cards with spending controls, and multi-asset transfers.
  Use when the user asks to "integrate Bloque", "create a card", "set up
  spending controls", "handle card webhooks", "transfer funds", "create
  pockets", "set up MCC routing", or build any fintech feature on the
  Bloque platform.
license: MIT
metadata:
  author: bloque
  version: "1.0.0"
---

# Bloque SDK Integration

TypeScript SDK for programmable financial infrastructure: accounts, cards, spending controls, transfers, and webhooks.

## When to Apply

Use this skill when:

- Integrating the Bloque SDK into a new or existing project
- Creating accounts (virtual pockets, cards, Polygon wallets, bank accounts)
- Setting up card spending controls (default or smart MCC routing)
- Handling card transaction webhooks
- Transferring funds between accounts (single or batch)
- Building budgeting or expense-management features
- Querying balances or transaction history

## SDK at a Glance

```
@bloque/sdk          → Main package (aggregates everything)
@bloque/sdk-core     → HttpClient, errors, types
@bloque/sdk-accounts → Accounts, cards, transfers
@bloque/sdk-identity → User identities and aliases
@bloque/sdk-compliance → KYC/KYB verification
@bloque/sdk-orgs     → Organizations
@bloque/sdk-swap     → Currency swap and bank transfers
```

**Platforms**: Node.js, Bun, Deno (API key auth) | Browser, React Native (JWT auth)
**Assets**: `DUSD/6`, `COPB/6`, `COPM/2`, `KSM/12`
**Amounts**: Always strings to preserve precision. `"10000000"` = 10 DUSD (6 decimals).

## Quick Start

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  origin: process.env.ORIGIN,
  auth: { type: 'apiKey', apiKey: process.env.API_KEY },
  mode: 'sandbox',
});

// Register a new user
await bloque.register('@alice', {
  type: 'individual',
  profile: { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com',
    phone: '+1234567890', birthdate: '1990-01-01', city: 'Miami', state: 'FL',
    postalCode: '33101', countryOfBirthCode: 'US', countryOfResidenceCode: 'US' },
});

// Connect to an existing user
const user = await bloque.connect('@alice');

// Create a pocket and a card
const pocket = await user.accounts.virtual.create({}, { waitLedger: true });
const card = await user.accounts.card.create(
  { ledgerId: pocket.ledgerId, name: 'My Card' },
  { waitLedger: true },
);
```

## References

For deeper guidance, read these files in order of relevance to the task:

| File | When to read |
|------|-------------|
| `references/api-reference.md` | **Read first for any integration.** All methods, params, and exact return types. |
| `references/quick-start.md` | First-time setup, configuration, auth strategies |
| `references/accounts.md` | Creating pockets, Polygon wallets, bank accounts |
| `references/cards-and-spending-controls.md` | Card creation, default/smart spending, MCC routing |
| `references/webhooks.md` | Handling transaction events, webhook payloads |
| `references/transfers.md` | Moving funds, batch transfers, movement metadata |

## Key Concepts

1. **Pockets** — Virtual accounts that hold funds. Every card must be linked to a pocket via `ledgerId`.
2. **Spending Controls** — `"default"` (one pocket, all merchants) or `"smart"` (MCC-based multi-pocket routing).
3. **MCC Routing** — Map Merchant Category Codes to pockets. Priority order determines fallback.
4. **Webhooks** — Async events for card transactions (authorization, adjustment). Delivered to `webhookUrl`.
5. **Assets** — Format is `SYMBOL/DECIMALS`. Amounts are raw integer strings. `10 DUSD = "10000000"`.

## Error Handling

All errors extend `BloqueAPIError` and include `requestId`, `timestamp`, and `toJSON()`:

| Error Class | HTTP | When |
|-------------|------|------|
| `BloqueValidationError` | 400 | Invalid params |
| `BloqueAuthenticationError` | 401/403 | Bad API key or JWT |
| `BloqueNotFoundError` | 404 | Resource missing |
| `BloqueRateLimitError` | 429 | Too many requests |
| `BloqueInsufficientFundsError` | — | Not enough balance |
| `BloqueNetworkError` | — | Connection failed |
| `BloqueTimeoutError` | — | Request timed out |

```typescript
import { BloqueInsufficientFundsError } from '@bloque/sdk-core';

try {
  await user.accounts.transfer({ sourceUrn, destinationUrn, amount, asset });
} catch (err) {
  if (err instanceof BloqueInsufficientFundsError) {
    console.log('Not enough funds:', err.toJSON());
  }
}
```
