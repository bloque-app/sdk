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
console.log(pocket.ledgerId);  // Used to link cards
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
```

## Create a Polygon Wallet

```typescript
const polygon = await user.accounts.polygon.create(
  { ledgerId: pocket.ledgerId },
  { waitLedger: true },
);
console.log(polygon.address); // Polygon wallet address for deposits
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
// List accounts
const accounts = await user.accounts.list();
const cards = await user.accounts.card.list();

// Get balance
const balance = await user.accounts.balance(pocket.urn);

// Get a specific account
const account = await user.accounts.get(pocket.urn);

// Lifecycle management
await user.accounts.activate(urn);
await user.accounts.freeze(urn);
await user.accounts.disable(urn);

// Update metadata
await user.accounts.card.updateMetadata({
  urn: card.urn,
  metadata: { preferred_asset: 'DUSD/6' },
});

// Update card name
await user.accounts.card.updateName(card.urn, 'My New Card Name');
```

## Card Account Properties

```typescript
interface CardAccount {
  urn: string;              // Unique resource name
  id: string;               // Card ID
  lastFour: string;         // Last 4 digits
  productType: 'CREDIT' | 'DEBIT';
  status: 'active' | 'disabled' | 'frozen' | 'deleted'
        | 'creation_in_progress' | 'creation_failed';
  cardType: 'VIRTUAL' | 'PHYSICAL';
  detailsUrl: string;       // PCI-compliant card details URL
  ownerUrn: string;
  ledgerId: string;
  webhookUrl: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  balance?: Record<string, TokenBalance>;
}
```

## Query Transactions

```typescript
const movements = await user.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',         // Filter by asset
  limit: 50,                // Max results
  direction: 'out',         // 'in' | 'out'
  before: '2025-12-31T00:00:00Z',
  after: '2025-01-01T00:00:00Z',
});
```
