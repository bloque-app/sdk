# Transfers

Move funds between any account types: virtual to virtual, virtual to card, card to polygon, etc.

## Single Transfer

```typescript
const result = await user.accounts.transfer({
  sourceUrn: savings.urn,
  destinationUrn: spending.urn,
  amount: '50000000',        // 50 DUSD (6 decimals)
  asset: 'DUSD/6',
  metadata: {
    note: 'Weekly allowance',
  },
});

console.log(result.queueId);  // Track the transfer
console.log(result.status);   // 'queued' | 'completed' | 'failed'
console.log(result.message);
```

**Amount format**: Always a raw integer string. `50 DUSD = 50 * 10^6 = "50000000"`.

## Batch Transfer

Send multiple transfers in a single call. Ideal for payroll, splitting bills, or distributing funds.

```typescript
const result = await user.accounts.batchTransfer({
  reference: 'payroll-2025-02',
  operations: [
    {
      fromUrn: treasury.urn,
      toUrn: alice.urn,
      reference: 'salary-alice-feb',
      amount: '3000000000',     // 3,000 DUSD
      asset: 'DUSD/6',
      metadata: { employee: 'alice', type: 'salary' },
    },
    {
      fromUrn: treasury.urn,
      toUrn: bob.urn,
      reference: 'salary-bob-feb',
      amount: '2500000000',     // 2,500 DUSD
      asset: 'DUSD/6',
      metadata: { employee: 'bob', type: 'salary' },
    },
  ],
  metadata: { department: 'engineering', period: '2025-02' },
  webhookUrl: 'https://api.example.com/webhooks/payroll',
});

console.log(`Batch: ${result.totalOperations} ops in ${result.totalChunks} chunk(s)`);
for (const chunk of result.chunks) {
  console.log(`  Chunk ${chunk.queueId}: ${chunk.status} — ${chunk.message}`);
}
```

**Auto-chunking**: Large batches (80+ operations) are automatically split into chunks. Each chunk gets its own `queueId`.

## Query Movements (Transaction History)

```typescript
// Card movements
const cardMovements = await user.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',
  limit: 50,
  direction: 'out',                      // 'in' | 'out'
  after: '2025-01-01T00:00:00Z',
  before: '2025-12-31T00:00:00Z',
  // reference: '0x...',                 // Filter by specific reference
  // collapsed_view: true,               // Grouped/summarized view
});

// General account movements
const movements = await user.accounts.movements({
  urn: pocket.urn,
  asset: 'DUSD/6',
});
```

## Movement Object Shape

Every movement returned by `card.movements()` or `accounts.movements()` has this shape:

```typescript
interface Movement {
  amount: string;            // Raw integer string (e.g., "9949" for 99.49 COPM)
  asset: string;             // Asset (e.g., "DUSD/6", "COPM/2")
  fromAccountId: string;     // Source ledger account ID
  toAccountId: string;       // Destination ledger account ID
  direction: 'in' | 'out' | 'failed';
  reference: string;         // Unique reference (see patterns below)
  railName: string;          // Processing rail
  status: 'pending' | 'confirmed' | 'settled' | 'cancelled' | 'failed' | 'ignored';
  details: {
    type: string;            // Movement classification
    metadata: Record<string, unknown>;  // Transaction details (see below)
  };
  createdAt: string;         // ISO 8601 timestamp
}
```

### Reference Patterns

The `reference` field identifies the type of movement and links related movements together:

| Movement Type | Reference Format | Example |
|---------------|------------------|---------|
| Card purchase | `{tx_id}:purchase` | `ctx-abc123:purchase` |
| Fee (interchange, fx, custom) | `{tx_id}:fee:{fee_name}` | `ctx-abc123:fee:interchange` |
| Refund (credit adjustment) | `{tx_id}:refund` | `ctx-abc123:refund` |
| Refund fee return | `{tx_id}:refund:fee:{fee_name}` | `ctx-abc123:refund:fee:fx` |
| Debit adjustment | `{tx_id}:adjustment` | `ctx-abc123:adjustment` |
| Adjustment fee | `{tx_id}:adjustment:fee:{fee_name}` | `ctx-abc123:adjustment:fee:interchange` |
| Smart spending purchase | `{tx_id}:{pocket_urn}:purchase` | `ctx-abc123:urn:...:purchase` |

Use `reference` to correlate a purchase with its fees, or a refund with its fee returns.

## Movement Metadata by Transaction Type

The `details.metadata` object contains the transaction details. The shape varies by type.

### Card Purchase Movement

When a card is swiped/tapped/used online. Direction: `out` from the pocket.

```json
{
  "type": "PURCHASE",
  "transaction_id": "ctx-200kXoaEJLNzcsvNxY1pmBO7fEx",
  "local_amount": "99.49",
  "local_currency": "COP",
  "debit_asset": "COPM/2",
  "exchange_rate": "1",
  "amount": "9949",
  "asset_type": "COPM/2",
  "card_id": "c-abc123",
  "card_last_four": "1573",
  "card_product_type": "DEBIT",
  "card_provider": "MASTERCARD",
  "user_id": "u-xyz789",
  "merchant_id": "MID-001",
  "merchant_name": "Exito Laureles",
  "merchant_mcc": "5411",
  "merchant_address": "Cra 70 #1-141",
  "merchant_city": "Medellin",
  "merchant_country": "COL",
  "merchant_terminal_id": "TID-001",
  "fee_breakdown": {
    "total": "343",
    "settlement": "9606",
    "fees": [
      { "fee_name": "interchange", "amount": "143", "rate": 0.0144 },
      { "fee_name": "fx", "amount": "200", "rate": 0.02 }
    ]
  }
}
```

**Reading this**: A purchase of 99.49 COP at "Exito Laureles" (grocery store, MCC 5411). Debited 9949 units of COPM/2 from the pocket. Fees: 143 interchange + 200 FX = 343 total. Net settlement: 9606.

### Fee Movement

Created alongside each purchase. One fee movement per fee type. Direction: internal redistribution (not visible to end users unless querying all movements).

```json
{
  "type": "FEE",
  "fee_type": "interchange",
  "fee_rate": 0.0144,
  "parent_reference": "ctx-200kXoaEJLNzcsvNxY1pmBO7fEx:purchase",
  "transaction_id": "ctx-200kXoaEJLNzcsvNxY1pmBO7fEx",
  "local_amount": "99.49",
  "local_currency": "COP",
  "debit_asset": "COPM/2",
  "exchange_rate": "1",
  "card_id": "c-abc123",
  "card_last_four": "1573",
  "card_provider": "MASTERCARD",
  "user_id": "u-xyz789"
}
```

**Linking**: Use `parent_reference` to find the purchase movement that triggered this fee.

### Refund (Credit Adjustment) Movement

When a merchant refunds a transaction. Direction: `in` to the pocket.

```json
{
  "type": "CREDIT_ADJUSTMENT",
  "transaction_id": "ctx-300kRefundABC",
  "original_transaction_id": "ctx-200kXoaEJLNzcsvNxY1pmBO7fEx",
  "local_amount": "99.49",
  "local_currency": "COP",
  "debit_asset": "COPM/2",
  "exchange_rate": "1",
  "card_id": "c-abc123",
  "card_last_four": "1573",
  "card_provider": "MASTERCARD",
  "user_id": "u-xyz789",
  "fee_breakdown": {
    "total": "343",
    "settlement": "9606",
    "fees": [
      { "fee_name": "interchange", "amount": "143", "rate": 0.0144 },
      { "fee_name": "fx", "amount": "200", "rate": 0.02 }
    ]
  }
}
```

**Note on smart spending**: Refunds always go to the **main wallet** (last pocket in `priority_mcc`), not back to the original category pocket.

### Debit Adjustment Movement

Additional charge or correction after the original authorization. Direction: `out`.

```json
{
  "type": "DEBIT_ADJUSTMENT",
  "transaction_id": "ctx-400kAdjustXYZ",
  "original_transaction_id": "ctx-200kXoaEJLNzcsvNxY1pmBO7fEx",
  "local_amount": "10.00",
  "local_currency": "COP",
  "debit_asset": "COPM/2",
  "exchange_rate": "1",
  "card_id": "c-abc123",
  "card_last_four": "1573",
  "card_provider": "MASTERCARD",
  "user_id": "u-xyz789",
  "fee_breakdown": {
    "total": "34",
    "settlement": "966",
    "fees": [
      { "fee_name": "interchange", "amount": "14", "rate": 0.0144 },
      { "fee_name": "fx", "amount": "20", "rate": 0.02 }
    ]
  }
}
```

### Top-Up / Internal Transfer Movement

When you transfer funds between accounts via the SDK. Direction: `in` on the destination, `out` on the source.

```json
{
  "type": "transfer",
  "metadata": {
    "note": "Card top-up"
  }
}
```

Top-ups don't have merchant or card info — they're simple ledger movements.

## Movement Metadata Field Reference

| Field | Type | Present In | Description |
|-------|------|-----------|-------------|
| `type` | `string` | All | `PURCHASE`, `FEE`, `CREDIT_ADJUSTMENT`, `DEBIT_ADJUSTMENT`, `transfer` |
| `transaction_id` | `string` | Card transactions | Unique ID for the card transaction |
| `original_transaction_id` | `string` | Adjustments | ID of the original transaction being adjusted |
| `local_amount` | `string` | Card transactions | Amount in the merchant's local currency |
| `local_currency` | `string` | Card transactions | ISO 4217 currency code (e.g., `COP`, `USD`) |
| `debit_asset` | `string` | Card transactions | Asset used for the debit (e.g., `COPM/2`, `DUSD/6`) |
| `exchange_rate` | `string` | Card transactions | FX rate applied (`"1"` if direct match) |
| `amount` | `string` | Card transactions | Debited amount in the asset's smallest unit |
| `asset_type` | `string` | Card transactions | Same as `debit_asset` |
| `card_id` | `string` | Card transactions | Internal card ID |
| `card_last_four` | `string` | Card transactions | Last 4 digits of the card |
| `card_product_type` | `string` | Card transactions | `DEBIT` or `CREDIT` |
| `card_provider` | `string` | Card transactions | `MASTERCARD` or `VISA` |
| `user_id` | `string` | Card transactions | Internal user ID |
| `merchant_id` | `string` | Purchases | Merchant ID |
| `merchant_name` | `string` | Purchases | Merchant name |
| `merchant_mcc` | `string` | Purchases | Merchant Category Code |
| `merchant_address` | `string` | Purchases | Merchant address |
| `merchant_city` | `string` | Purchases | Merchant city |
| `merchant_country` | `string` | Purchases | ISO country code (e.g., `COL`) |
| `merchant_terminal_id` | `string` | Purchases | Terminal ID |
| `fee_type` | `string` | Fee movements | Fee name (e.g., `interchange`, `fx`) |
| `fee_rate` | `number` | Fee movements | Fee rate (e.g., `0.0144`) |
| `fee_breakdown` | `object` | Purchases, Adjustments | Total fees, individual fees, and net settlement |
| `parent_reference` | `string` | Fee movements | Reference of the purchase that triggered this fee |
| `installments` | `string` | Purchases | Number of installments (if applicable) |

## Practical Examples

### Display a User's Card Purchase History

```typescript
const movements = await user.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',
  direction: 'out',
  limit: 20,
});

for (const m of movements) {
  const meta = m.details.metadata;
  if (meta?.type === 'PURCHASE') {
    console.log(`${meta.merchant_name} — ${meta.local_amount} ${meta.local_currency}`);
    console.log(`  MCC: ${meta.merchant_mcc} | Card: ***${meta.card_last_four}`);
    console.log(`  Debited: ${m.amount} ${m.asset}`);
    if (meta.fee_breakdown) {
      console.log(`  Fees: ${meta.fee_breakdown.total} | Net: ${meta.fee_breakdown.settlement}`);
    }
    console.log(`  Ref: ${m.reference}`);
    console.log(`  Date: ${m.createdAt}`);
    console.log();
  }
}
```

### Find All Movements for a Specific Transaction

Use the `reference` field to correlate purchase + fees:

```typescript
const txId = 'ctx-200kXoaEJLNzcsvNxY1pmBO7fEx';

const allMovements = await user.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',
});

// The purchase movement
const purchase = allMovements.find(m => m.reference === `${txId}:purchase`);

// Its fee movements
const fees = allMovements.filter(m => m.reference.startsWith(`${txId}:fee:`));

console.log('Purchase:', purchase?.amount, purchase?.asset);
for (const fee of fees) {
  const meta = fee.details.metadata;
  console.log(`  Fee (${meta?.fee_type}): ${fee.amount} @ ${meta?.fee_rate}`);
}
```

### Track Refunds

```typescript
const movements = await user.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',
  direction: 'in',  // Refunds are incoming
});

const refunds = movements.filter(m => m.details.metadata?.type === 'CREDIT_ADJUSTMENT');

for (const refund of refunds) {
  const meta = refund.details.metadata;
  console.log(`Refund: ${refund.amount} ${refund.asset}`);
  console.log(`  Original tx: ${meta?.original_transaction_id}`);
  console.log(`  Merchant: ${meta?.merchant_name}`);
}
```

### Calculate Total Spending by MCC Category

```typescript
const movements = await user.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',
  direction: 'out',
});

const byCategory = new Map<string, bigint>();

for (const m of movements) {
  const meta = m.details.metadata;
  if (meta?.type === 'PURCHASE' && meta?.merchant_mcc) {
    const mcc = meta.merchant_mcc as string;
    const current = byCategory.get(mcc) ?? 0n;
    byCategory.set(mcc, current + BigInt(m.amount));
  }
}

// Display totals
for (const [mcc, total] of byCategory) {
  const human = Number(total) / 1_000_000; // DUSD/6
  console.log(`MCC ${mcc}: ${human.toFixed(2)} DUSD`);
}
```

## Get Balance

```typescript
const balance = await user.accounts.balance(pocket.urn);
// Returns: Record<asset, { current: string, pending: string, in: string, out: string }>

// Example:
// {
//   "DUSD/6": { current: "50000000", pending: "0", in: "100000000", out: "50000000" }
// }
```

| Field | Description |
|-------|-------------|
| `current` | Available balance right now |
| `pending` | Balance reserved for pending transactions |
| `in` | Total incoming (all time) |
| `out` | Total outgoing (all time) |

## Common Patterns

### Fund a Card

```typescript
// Create pocket → fund it → link card
const pocket = await user.accounts.virtual.create({}, { waitLedger: true });

// Fund the pocket (from another account)
await user.accounts.transfer({
  sourceUrn: treasury.urn,
  destinationUrn: pocket.urn,
  amount: '100000000',  // 100 DUSD
  asset: 'DUSD/6',
});

// Create card linked to the funded pocket
const card = await user.accounts.card.create(
  { ledgerId: pocket.ledgerId, name: 'Funded Card' },
  { waitLedger: true },
);
```

### Top Up a Card

```typescript
await user.accounts.transfer({
  sourceUrn: savings.urn,
  destinationUrn: card.urn,
  amount: '25000000',  // 25 DUSD
  asset: 'DUSD/6',
  metadata: { note: 'Card top-up' },
});
```

### Distribute Funds to Category Pockets

```typescript
// Fund multiple pockets from a main account
const pockets = [
  { urn: foodPocket.urn, amount: '20000000' },      // 20 DUSD
  { urn: transportPocket.urn, amount: '15000000' },  // 15 DUSD
  { urn: generalPocket.urn, amount: '50000000' },    // 50 DUSD
];

await user.accounts.batchTransfer({
  reference: 'monthly-budget-feb',
  operations: pockets.map(p => ({
    fromUrn: treasury.urn,
    toUrn: p.urn,
    amount: p.amount,
    asset: 'DUSD/6',
    reference: `budget-${p.urn}`,
  })),
});
```

## Currency Swap (PSE Top-Up)

Convert COP to DUSD via PSE (Colombian bank transfer):

```typescript
// 1. Find rates
const rates = await user.swap.findRates({
  fromAsset: 'COP/2',
  toAsset: 'DUSD/6',
  fromMediums: ['pse'],
  toMediums: ['kusama'],
  amountSrc: '1000000',
});

// 2. Get available banks
const banks = await user.swap.pse.banks();

// 3. Create PSE order
const result = await user.swap.pse.create({
  rateSig: rates.rates[0].sig,
  toMedium: 'kusama',
  amountSrc: '1000000',
  depositInformation: { urn: card.urn },
  args: {
    bankCode: banks.banks[0].code,
    userType: 'natural',
    customerEmail: 'user@example.com',
    userLegalIdType: 'CC',
    userLegalId: '123456789',
    customerData: { fullName: 'Alice Smith' },
  },
});

// 4. Redirect user to PSE payment page
console.log('Payment URL:', result.execution?.result.how?.url);
```
