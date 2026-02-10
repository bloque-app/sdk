# Cards and Spending Controls

## Overview

Cards are the spending medium. Every card is linked to a pocket (virtual account) via `ledgerId`. Spending controls determine *how* the card debits funds when a purchase happens.

Two modes:

| Mode | Config | Behavior |
|------|--------|----------|
| `default` | Single pocket | All merchants accepted. One pocket debited. |
| `smart` | Multi-pocket + MCC routing | Route transactions to pockets by merchant category. |

## Default Spending Control

The simplest setup. One pocket, one card, all merchants accepted.

```typescript
const pocket = await user.accounts.virtual.create({}, { waitLedger: true });

const card = await user.accounts.card.create(
  {
    name: 'My Everyday Card',
    ledgerId: pocket.ledgerId,
    metadata: {
      spending_control: 'default',   // Optional — this is the default
      preferred_asset: 'DUSD/6',
      default_asset: 'DUSD/6',
    },
  },
  { waitLedger: true },
);
```

**What happens on purchase**: Card debits the full amount (+ fees) from the linked pocket. Any merchant accepted.

## Smart Spending Control (MCC Routing)

Route transactions to different pockets based on Merchant Category Codes (MCC).

### How It Works

1. A purchase comes in with a Merchant Category Code (MCC)
2. The system checks each pocket in `priority_mcc` order
3. If the MCC matches a pocket's whitelist, debit from that pocket
4. If no match or insufficient funds, try the next pocket
5. Pockets without a whitelist entry are "catch-all" (accept any MCC)

### Basic Setup (Two Pockets)

```typescript
// Category pocket — only food purchases
const foodPocket = await user.accounts.virtual.create(
  { name: 'Food Budget' },
  { waitLedger: true },
);

// Catch-all pocket — everything else
const mainWallet = await user.accounts.virtual.create(
  { name: 'Main Wallet' },
  { waitLedger: true },
);

const card = await user.accounts.card.create(
  {
    name: 'Smart Card',
    ledgerId: mainWallet.ledgerId,
    metadata: {
      spending_control: 'smart',
      preferred_asset: 'DUSD/6',
      default_asset: 'DUSD/6',
      mcc_whitelist: {
        [foodPocket.urn]: ['5411', '5812', '5814'],
      },
      priority_mcc: [foodPocket.urn, mainWallet.urn],
    },
  },
  { waitLedger: true },
);
```

### Multi-Category Setup

```typescript
const foodPocket = await user.accounts.virtual.create({ name: 'Food' }, { waitLedger: true });
const transportPocket = await user.accounts.virtual.create({ name: 'Transport' }, { waitLedger: true });
const generalPocket = await user.accounts.virtual.create({ name: 'General' }, { waitLedger: true });

const card = await user.accounts.card.create(
  {
    name: 'Budget Master',
    ledgerId: generalPocket.ledgerId,
    metadata: {
      spending_control: 'smart',
      preferred_asset: 'DUSD/6',
      default_asset: 'DUSD/6',
      mcc_whitelist: {
        [foodPocket.urn]: ['5411', '5812', '5814'],
        [transportPocket.urn]: ['4111', '4121', '4131', '5541', '5542'],
        // generalPocket has NO entry → catch-all
      },
      priority_mcc: [foodPocket.urn, transportPocket.urn, generalPocket.urn],
    },
  },
  { waitLedger: true },
);
```

**Result**:
- Grocery (MCC 5411) → Food pocket
- Uber (MCC 4121) → Transport pocket
- Online shopping → General pocket (catch-all)
- If Food pocket is empty → falls through to Transport (no match) → General (catch-all)

## Update Spending Controls

Upgrade from default to smart, add new categories, or change routing — all via `updateMetadata`. No need to recreate the card.

```typescript
// Upgrade a default card to smart
await user.accounts.card.updateMetadata({
  urn: card.urn,
  metadata: {
    spending_control: 'smart',
    mcc_whitelist: {
      [foodPocket.urn]: ['5411', '5812', '5814'],
    },
    priority_mcc: [foodPocket.urn, mainWallet.urn],
  },
});

// Add a new category pocket
const entertainmentPocket = await user.accounts.virtual.create(
  { name: 'Entertainment' },
  { waitLedger: true },
);

// Send the FULL config (not a partial update)
await user.accounts.card.updateMetadata({
  urn: card.urn,
  metadata: {
    spending_control: 'smart',
    mcc_whitelist: {
      [foodPocket.urn]: ['5411', '5812', '5814'],
      [entertainmentPocket.urn]: ['7832', '7841', '7911'],
    },
    priority_mcc: [foodPocket.urn, entertainmentPocket.urn, mainWallet.urn],
  },
});
```

**Important**: `updateMetadata` replaces the full metadata object. Always send the complete spending control config, not just the changed fields.

## MCC Code Reference

| Category | MCCs | Description |
|----------|------|-------------|
| **Food** | `5411` | Grocery stores |
| | `5812` | Restaurants |
| | `5814` | Fast food |
| **Transport** | `4111` | Local commuter transport |
| | `4121` | Taxis and rideshares |
| | `4131` | Bus lines |
| | `5541` | Gas stations |
| | `5542` | Fuel dealers |
| **Entertainment** | `7832` | Movies |
| | `7841` | Streaming services |
| | `7911` | Entertainment events |
| **Health** | `5912` | Pharmacies |
| | `8011` | Doctors |
| | `8021` | Dentists |
| **Shopping** | `5311` | Department stores |
| | `5651` | Clothing stores |
| | `5691` | Clothing accessories |

## Metadata Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spending_control` | `'default' \| 'smart'` | No | Control type. Defaults to `'default'`. |
| `preferred_asset` | `string` | No | Preferred asset for transactions (e.g., `'DUSD/6'`). |
| `default_asset` | `string` | No | Fallback asset when preferred is unavailable. |
| `mcc_whitelist` | `Record<pocketUrn, string[]>` | Smart only | Map of pocket URNs to allowed MCC codes. |
| `priority_mcc` | `string[]` | Smart only | Ordered list of pocket URNs. Checked top-to-bottom. |

## Processing Details

### Fee Structure

Each card transaction includes fees (configurable per origin):

- **Interchange fee**: ~1.44% (default)
- **FX fee**: ~2.00% (default)

Fees are deducted internally. The card is debited the full amount; fees are redistributed to fee accounts automatically.

### Multi-Currency

The system supports multi-currency transactions:

1. **Direct match**: If the transaction currency matches an available asset (e.g., COP transaction with COPM balance), no conversion.
2. **Conversion**: If no direct match, the system converts using exchange rates (e.g., COP transaction → USD debit).
3. **Asset preference**: When multiple assets are available, the system prefers the one matching `preferred_asset`.

### Concurrency (Smart Spending)

Smart spending uses Redis locks to prevent race conditions when multiple transactions hit the same pockets simultaneously. Locks are acquired in sorted order to prevent deadlocks and released after the batch executes.
