# Webhooks

Webhooks deliver real-time notifications about card transactions to your server.

## Setup

Set `webhookUrl` when creating a card:

```typescript
const card = await user.accounts.card.create(
  {
    ledgerId: pocket.ledgerId,
    webhookUrl: 'https://api.example.com/webhooks/card',
    metadata: { spending_control: 'default', preferred_asset: 'DUSD/6' },
  },
  { waitLedger: true },
);
```

Or update it on a batch transfer:

```typescript
await user.accounts.batchTransfer({
  operations: [...],
  webhookUrl: 'https://api.example.com/webhooks/batch',
});
```

## Event Types

### Authorization Events

Triggered when a card purchase is attempted.

| Event Type | Direction | Description |
|------------|-----------|-------------|
| `authorization` | `debit` | Purchase approved — funds debited |
| `authorization` | `debit` | Purchase rejected — insufficient funds |
| `authorization` | `debit` | Purchase rejected — unsupported currency |

### Adjustment Events

Triggered after the original authorization (refunds, chargebacks, corrections).

| Event Type | Direction | Description |
|------------|-----------|-------------|
| `adjustment` | `credit` | Refund — funds returned to account |
| `adjustment` | `debit` | Additional charge or correction |

## Webhook Payload Shape

```typescript
interface WebhookPayload {
  /** URN of the card account */
  account_urn: string;

  /** Event classification */
  type: 'authorization' | 'adjustment';

  /** Fund flow direction */
  direction: 'debit' | 'credit';

  /** Purchase amount in the local currency */
  local_amount: string;

  /** Local currency code (e.g., "COP", "USD") */
  local_currency: string;

  /** Amount debited/credited in the ledger asset */
  amount: string;

  /** Asset used for the debit/credit (e.g., "DUSD/6") */
  asset: string;

  /** Exchange rate applied (if currency conversion occurred) */
  exchange_rate?: string;

  /** Transaction reference ID */
  transaction_id: string;

  /** Merchant information */
  merchant: {
    id: string;
    name: string;
    mcc: string;          // Merchant Category Code
    address?: string;
    city?: string;
    country?: string;
    terminal_id?: string;
  };

  /** Transaction medium details */
  medium: {
    entry_mode: string;           // e.g., "contactless", "chip", "manual"
    point_type: string;           // e.g., "pos", "ecommerce"
    origin: string;               // e.g., "domestic", "international"
    network: string;              // e.g., "visa", "mastercard"
    cardholder_presence?: string;
    pin_presence?: string;
    tokenization_wallet_name?: string; // e.g., "apple_pay", "google_pay"
  };

  /** Fee breakdown */
  fee_breakdown: {
    total: string;                // Total fees
    settlement: string;           // Net settlement amount
    fees: Array<{
      type: string;               // e.g., "interchange", "fx"
      rate: string;               // e.g., "0.0144"
      amount: string;             // Fee amount
    }>;
  };
}
```

## Example Payloads

### Purchase Approved (Authorization Debit)

```json
{
  "account_urn": "did:bloque:account:card:usr-abc:crd-123",
  "type": "authorization",
  "direction": "debit",
  "transaction_id": "ctx-200kXoaEJLNzcsvNxY1pmBO7fEx",
  "local_amount": "99.49",
  "local_currency": "COP",
  "amount": "9949",
  "asset": "COPM/2",
  "exchange_rate": "1",
  "merchant": {
    "id": "MID-001",
    "name": "Exito Laureles",
    "mcc": "5411",
    "address": "Cra 70 #1-141",
    "city": "Medellin",
    "country": "COL",
    "terminal_id": "TID-001"
  },
  "medium": {
    "entry_mode": "CONTACTLESS",
    "point_type": "POS",
    "origin": "DOMESTIC",
    "network": "MASTERCARD",
    "cardholder_presence": "PRESENT",
    "tokenization_wallet_name": "apple_pay"
  },
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

### Purchase with Currency Conversion (USD transaction, DUSD balance)

```json
{
  "account_urn": "did:bloque:account:card:usr-abc:crd-123",
  "type": "authorization",
  "direction": "debit",
  "transaction_id": "ctx-500kUSDtx",
  "local_amount": "25.00",
  "local_currency": "USD",
  "amount": "25000000",
  "asset": "DUSD/6",
  "exchange_rate": "1",
  "merchant": {
    "id": "MID-002",
    "name": "Amazon.com",
    "mcc": "5942",
    "city": "Seattle",
    "country": "USA"
  },
  "medium": {
    "entry_mode": "CREDENTIAL_ON_FILE",
    "point_type": "ECOMMERCE",
    "origin": "INTERNATIONAL",
    "network": "VISA"
  },
  "fee_breakdown": {
    "total": "860000",
    "settlement": "24140000",
    "fees": [
      { "fee_name": "interchange", "amount": "360000", "rate": 0.0144 },
      { "fee_name": "fx", "amount": "500000", "rate": 0.02 }
    ]
  }
}
```

### Refund (Adjustment Credit)

```json
{
  "account_urn": "did:bloque:account:card:usr-abc:crd-123",
  "type": "adjustment",
  "direction": "credit",
  "transaction_id": "ctx-300kRefundABC",
  "original_transaction_id": "ctx-200kXoaEJLNzcsvNxY1pmBO7fEx",
  "local_amount": "99.49",
  "local_currency": "COP",
  "amount": "9949",
  "asset": "COPM/2",
  "exchange_rate": "1",
  "merchant": {
    "id": "MID-001",
    "name": "Exito Laureles",
    "mcc": "5411",
    "city": "Medellin",
    "country": "COL"
  },
  "medium": {
    "entry_mode": "CONTACTLESS",
    "point_type": "POS",
    "origin": "DOMESTIC",
    "network": "MASTERCARD"
  },
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

### Purchase Rejected (Insufficient Funds)

When a purchase is rejected, the webhook is still sent but with no `fee_breakdown` and the amount reflects what was attempted.

```json
{
  "account_urn": "did:bloque:account:card:usr-abc:crd-123",
  "type": "authorization",
  "direction": "debit",
  "transaction_id": "ctx-400kRejected",
  "status": "rejected_insufficient_funds",
  "local_amount": "500.00",
  "local_currency": "USD",
  "amount": "0",
  "asset": "DUSD/6",
  "merchant": {
    "id": "MID-003",
    "name": "Best Buy",
    "mcc": "5732",
    "city": "Miami",
    "country": "USA"
  },
  "medium": {
    "entry_mode": "CHIP",
    "point_type": "POS",
    "origin": "INTERNATIONAL",
    "network": "VISA"
  }
}
```

## Webhook Handler Examples

### Basic Handler (Express / Hono / Fastify)

```typescript
app.post('/webhooks/card', async (req, res) => {
  const event = req.body as WebhookPayload;

  switch (event.type) {
    case 'authorization':
      if (event.direction === 'debit') {
        console.log(`Purchase: ${event.local_amount} ${event.local_currency}`);
        console.log(`Merchant: ${event.merchant.name} (MCC ${event.merchant.mcc})`);
        console.log(`Debited: ${event.amount} ${event.asset}`);

        await notifyUser(event.account_urn, {
          type: 'purchase',
          merchant: event.merchant.name,
          amount: event.local_amount,
          currency: event.local_currency,
        });
      }
      break;

    case 'adjustment':
      if (event.direction === 'credit') {
        console.log(`Refund: ${event.amount} ${event.asset}`);
        await notifyUser(event.account_urn, { type: 'refund', amount: event.amount });
      }
      break;
  }

  res.status(200).json({ received: true });
});
```

### Full Handler with Idempotency and Logging

```typescript
const processedEvents = new Set<string>();

app.post('/webhooks/card', async (req, res) => {
  const event = req.body as WebhookPayload;

  // Idempotency check — webhook may be delivered more than once
  const eventKey = `${event.type}-${event.transaction_id}`;
  if (processedEvents.has(eventKey)) {
    return res.status(200).json({ received: true, deduplicated: true });
  }
  processedEvents.add(eventKey);

  // Log for audit
  console.log(JSON.stringify({
    webhook: event.type,
    direction: event.direction,
    account: event.account_urn,
    tx: event.transaction_id,
    merchant: event.merchant?.name,
    mcc: event.merchant?.mcc,
    local: `${event.local_amount} ${event.local_currency}`,
    debited: `${event.amount} ${event.asset}`,
    entry: event.medium?.entry_mode,
    wallet: event.medium?.tokenization_wallet_name || 'physical',
    fees: event.fee_breakdown?.total,
    net: event.fee_breakdown?.settlement,
  }));

  // Route by event type
  if (event.type === 'authorization' && event.direction === 'debit') {
    // Purchase — update balance UI, send push notification
    await db.transactions.create({
      accountUrn: event.account_urn,
      transactionId: event.transaction_id,
      merchantName: event.merchant.name,
      merchantMcc: event.merchant.mcc,
      localAmount: event.local_amount,
      localCurrency: event.local_currency,
      amount: event.amount,
      asset: event.asset,
      fees: event.fee_breakdown?.total,
      settlement: event.fee_breakdown?.settlement,
      entryMode: event.medium.entry_mode,
      wallet: event.medium.tokenization_wallet_name,
    });

    await pushNotification(event.account_urn, {
      title: `Purchase at ${event.merchant.name}`,
      body: `${event.local_amount} ${event.local_currency}`,
    });
  }

  if (event.type === 'adjustment' && event.direction === 'credit') {
    // Refund — update original transaction, notify user
    await db.transactions.update({
      originalTransactionId: event.original_transaction_id,
      refundAmount: event.amount,
      refundTransactionId: event.transaction_id,
    });

    await pushNotification(event.account_urn, {
      title: 'Refund received',
      body: `${event.local_amount} ${event.local_currency} from ${event.merchant.name}`,
    });
  }

  res.status(200).json({ received: true });
});
```

## Transaction Lifecycle

Understanding the full lifecycle of a card transaction:

```
                         ┌──────────────┐
   Card swipe/tap ──────▶│  Authorization│
                         │   Request     │
                         └──────┬───────┘
                                │
                    ┌───────────▼────────────┐
                    │  Resolve Spending       │
                    │  Control (default/smart)│
                    └───────────┬────────────┘
                                │
              ┌─────────────────▼──────────────────┐
              │                                     │
     ┌────────▼────────┐              ┌─────────────▼─────────┐
     │ Default Control │              │  Smart Control         │
     │ Debit pocket    │              │  1. Match MCC          │
     │                 │              │  2. Walk priority list  │
     │                 │              │  3. Debit best pocket   │
     └────────┬────────┘              └─────────────┬─────────┘
              │                                     │
              └──────────────┬──────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Execute Batch   │
                    │ Movements       │
                    │ (atomic)        │
                    └────────┬────────┘
                             │
               ┌─────────────▼──────────────┐
               │  Fire Events               │
               │  • Webhook (async)         │
               │  • WhatsApp notification   │
               └─────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │ Return APPROVED │
                    │ or REJECTED     │
                    └─────────────────┘
```

### Key Points

- **Idempotent delivery**: Webhooks use idempotency keys (`{type}-{transactionId}`). Your handler should be idempotent.
- **Async delivery**: Webhooks are delivered asynchronously via a task queue. Expect slight delay (seconds).
- **Retry**: Failed webhook deliveries are retried automatically.
- **Refund routing (smart spending)**: Refunds go to the main wallet (last pocket in `priority_mcc`), not the original category pocket.
- **Fee handling on refunds**: Credit adjustments return fees to the platform first, then credit the user account.
