# Accounts

Accounts are the foundation. Every financial operation flows through accounts.

## Account Types

| Type | Client | Description | Use Case |
|------|--------|-------------|----------|
| Virtual | `user.accounts.virtual` | Simple ledger account ("pocket") | Hold funds, budget categories |
| Card | `user.accounts.card` | Virtual/physical card | Spend at merchants |
| Polygon | `user.accounts.polygon` | Polygon blockchain wallet | Receive crypto |
| Bancolombia | `user.accounts.bancolombia` | Colombian bank account | Receive COP |
| US | `user.accounts.us` | US bank account | Receive USD |

## The Pocket Pattern

Pockets are virtual accounts that hold funds. Cards are linked to pockets via `ledgerId`.

```
┌─────────────┐     ┌─────────────┐
│   Pocket    │────▶│    Card     │
│ (virtual)   │     │ (spending)  │
│ holds funds │     │ uses funds  │
└─────────────┘     └─────────────┘
      ▲
      │ transfer
┌─────────────┐
│  Polygon    │
│  (deposit)  │
└─────────────┘
```

## Create a Pocket (Virtual Account)

```typescript
const pocket = await user.accounts.virtual.create(
  { name: 'Savings' },     // name is optional
  { waitLedger: true },     // wait for ledger to be ready
);

console.log(pocket.urn);       // "did:bloque:account:virtual:usr-xxx:vrt-xxx"
console.log(pocket.ledgerId);  // Use this to link cards
console.log(pocket.status);    // "active"
console.log(pocket.firstName); // From the identity profile
console.log(pocket.lastName);
```

**Returns `VirtualAccount`:**

```typescript
{
  urn: string;          id: string;
  firstName: string;    lastName: string;
  status: AccountStatus;
  ownerUrn: string;     ledgerId: string;
  webhookUrl: string | null;
  metadata?: Record<string, string>;
  createdAt: string;    updatedAt: string;
  balance?: Record<string, TokenBalance>;  // Present with waitLedger
}
```

The `{ waitLedger: true }` option waits for the ledger account to be provisioned before returning. Always use this when you need the `ledgerId` immediately (e.g., to create a card).

## Create a Card Linked to a Pocket

```typescript
const card = await user.accounts.card.create(
  {
    name: 'My Card',
    ledgerId: pocket.ledgerId,   // Links card to pocket
    webhookUrl: 'https://api.example.com/webhooks/card',
    metadata: {
      spending_control: 'default',
      preferred_asset: 'DUSD/6',
      default_asset: 'DUSD/6',
    },
  },
  { waitLedger: true },
);

console.log(card.urn);          // "did:bloque:account:card:usr-xxx:crd-xxx"
console.log(card.lastFour);     // "1573"
console.log(card.productType);  // "DEBIT"
console.log(card.cardType);     // "VIRTUAL"
console.log(card.detailsUrl);   // PCI-compliant URL for card number/CVV
console.log(card.status);       // "active"
```

**Returns `CardAccount`:**

```typescript
{
  urn: string;           id: string;
  lastFour: string;      productType: 'CREDIT' | 'DEBIT';
  status: AccountStatus; cardType: 'VIRTUAL' | 'PHYSICAL';
  detailsUrl: string;    ownerUrn: string;   // ⚠️ detailsUrl expires — see below
  ledgerId: string;      webhookUrl: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;     updatedAt: string;
  balance?: Record<string, TokenBalance>;  // Only in list() responses
}
```

### Refreshing Card Details URL

The `detailsUrl` is a signed, PCI-compliant URL that shows the full card number, CVV, and expiry. **It expires after a short window.** Do NOT cache it.

To get a fresh URL, call `user.accounts.get()`:

```typescript
// ❌ Wrong — this URL may be expired
const card = await user.accounts.card.create({ ledgerId: pocket.ledgerId }, { waitLedger: true });
iframe.src = card.detailsUrl; // Might be expired if time has passed

// ✅ Correct — fetch a fresh URL right before displaying
const fresh = await user.accounts.get(card.urn);
iframe.src = fresh.detailsUrl; // Fresh signed URL, ready to use
```

Always call `user.accounts.get(card.urn)` to obtain a fresh `detailsUrl` right before rendering it to the user.

## Create a Polygon Wallet

```typescript
const polygon = await user.accounts.polygon.create(
  { ledgerId: pocket.ledgerId },
  { waitLedger: true },
);

console.log(polygon.urn);       // "did:bloque:account:polygon:0x..."
console.log(polygon.address);   // "0x05B10c9B624..." — wallet address for deposits
console.log(polygon.network);   // "polygon"
```

**Returns `PolygonAccount`:**

```typescript
{
  urn: string;           id: string;
  address: string;       network: string;   // "polygon"
  status: AccountStatus; ownerUrn: string;
  ledgerId: string;      webhookUrl: string | null;
  metadata?: Record<string, string>;
  createdAt: string;     updatedAt: string;
  balance?: Record<string, TokenBalance>;
}
```

## Multi-Account Setup

Link multiple mediums (polygon, card) to the same pocket:

```typescript
const pocket = await user.accounts.virtual.create({}, { waitLedger: true });

// Receive crypto on Polygon
const polygon = await user.accounts.polygon.create(
  { ledgerId: pocket.ledgerId },
  { waitLedger: true },
);

// Spend with a card
const card = await user.accounts.card.create(
  { ledgerId: pocket.ledgerId },
  { waitLedger: true },
);
// Now: crypto deposits → pocket → card spending
```

## Common Operations (All Account Types)

```typescript
// List all accounts → { accounts: Account[] }
const result = await user.accounts.list();
console.log(result.accounts);  // Array of Account objects with balance

// List by type → { accounts: CardAccount[] }
const cards = await user.accounts.card.list();
console.log(cards.accounts);   // Array of CardAccount with balance

// Get balance → Record<string, TokenBalance>
const balance = await user.accounts.balance(pocket.urn);
console.log(balance['DUSD/6'].current);  // "50000000"

// Get a specific account → Account
const account = await user.accounts.get(pocket.urn);

// Lifecycle management → returns updated account object
const activated = await user.accounts.card.activate(urn);
const frozen = await user.accounts.card.freeze(urn);
const disabled = await user.accounts.card.disable(urn);
console.log(frozen.status);  // "frozen"

// Update metadata → returns updated account object
const updated = await user.accounts.card.updateMetadata({
  urn: card.urn,
  metadata: { preferred_asset: 'DUSD/6' },
});

// Update card name → returns updated CardAccount
const renamed = await user.accounts.card.updateName(card.urn, 'My New Card Name');
```

**Important: `list()` wraps results in `{ accounts: [...] }`** — it does NOT return an array directly. Always access `.accounts` on the result.

## Query Transactions

```typescript
// Returns Movement[] (an array directly, NOT wrapped in an object)
const movements = await user.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',         // Filter by asset
  limit: 50,                // Max results
  direction: 'out',         // 'in' | 'out'
  before: '2025-12-31T00:00:00Z',
  after: '2025-01-01T00:00:00Z',
});

for (const m of movements) {
  console.log(m.amount, m.asset, m.direction, m.reference);
  console.log(m.details.metadata);  // Transaction details (merchant, fees, etc.)
}
```

See `transfers.md` for full movement metadata shapes by transaction type (purchase, fee, refund, top-up).
