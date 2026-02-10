# API Reference — All Methods and Return Types

Every SDK method, its parameters, and the exact shape of the returned object.

---

## SDK (Top Level)

### `new SDK(config)`

```typescript
const bloque = new SDK({
  origin: string;             // Required. Your origin identifier.
  auth:
    | { type: 'apiKey'; apiKey: string }   // Backend
    | { type: 'jwt' };                     // Frontend
  mode?: 'production' | 'sandbox';         // Default: 'production'
  platform?: 'node' | 'bun' | 'deno' | 'browser' | 'react-native'; // Auto-detected
  timeout?: number;            // Default: 30000 (ms)
  tokenStorage?: TokenStorage; // Required for browser/react-native
  retry?: {
    enabled?: boolean;         // Default: true
    maxRetries?: number;       // Default: 3
    initialDelay?: number;     // Default: 1000 (ms)
    maxDelay?: number;         // Default: 30000 (ms)
  };
});
```

### `bloque.register(alias, params)` → Session

Registers a new user identity and returns a connected session.

```typescript
const session = await bloque.register('@alice', {
  type: 'individual',
  profile: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    birthdate?: string;          // 'YYYY-MM-DD'
    city?: string;
    state?: string;
    postalCode?: string;
    countryOfBirthCode?: string;
    countryOfResidenceCode?: string;
  },
});
```

**Returns: `Session`**

```typescript
{
  urn: string;                   // User URN (e.g., "did:bloque:origin:alice")
  accessToken: string;           // JWT access token
  accounts: AccountsClient;      // user.accounts.*
  compliance: ComplianceClient;  // user.compliance.*
  identity: IdentityClient;      // user.identity.*
  orgs: OrgsClient;              // user.orgs.*
  swap: SwapClient;              // user.swap.*
}
```

### `bloque.connect(alias)` → Session

Connects to an existing user. Returns the same `Session` shape as `register`.

```typescript
const user = await bloque.connect('@alice');
// user.urn, user.accounts, user.compliance, etc.
```

---

## AccountsClient (`user.accounts`)

### `user.accounts.balance(urn)` → `Record<string, TokenBalance>`

```typescript
const balance = await user.accounts.balance('did:bloque:account:virtual:...');
```

**Returns:**

```typescript
{
  "DUSD/6": {
    current: "50000000",    // Available balance
    pending: "0",           // Reserved for pending transactions
    in: "100000000",        // Total incoming (all time)
    out: "50000000"         // Total outgoing (all time)
  }
}
```

### `user.accounts.get(urn)` → `Account`

```typescript
const account = await user.accounts.get('did:bloque:account:virtual:...');
```

**Returns:**

```typescript
{
  id: string;
  urn: string;
  medium: 'bancolombia' | 'card' | 'virtual' | 'polygon' | 'us-account';
  details: unknown;           // Shape depends on medium
  ledgerId: string;
  status: 'active' | 'disabled' | 'frozen' | 'deleted'
        | 'creation_in_progress' | 'creation_failed';
  ownerUrn: string;
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
  webhookUrl: string | null;
  metadata?: Record<string, unknown>;
  balance: Record<string, TokenBalance>;
}
```

### `user.accounts.list(params?)` → `{ accounts: Account[] }`

```typescript
const result = await user.accounts.list();
// or filter:
const result = await user.accounts.list({ medium: 'card' });
const result = await user.accounts.list({ urn: '...' });
```

**Params (all optional):**

| Param | Type | Description |
|-------|------|-------------|
| `holderUrn` | `string` | Filter by holder |
| `urn` | `string` | Get specific account |
| `medium` | `'bancolombia' \| 'card' \| 'virtual' \| 'polygon' \| 'us-account'` | Filter by type |

**Returns:**

```typescript
{
  accounts: Account[]   // Array of Account objects (same shape as get())
}
```

### `user.accounts.transfer(params)` → `TransferResult`

```typescript
const result = await user.accounts.transfer({
  sourceUrn: string;
  destinationUrn: string;
  amount: string;              // Raw integer string
  asset: 'DUSD/6' | 'COPB/6' | 'COPM/2' | 'KSM/12';
  metadata?: Record<string, unknown>;
});
```

**Returns:**

```typescript
{
  queueId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
}
```

### `user.accounts.batchTransfer(params)` → `BatchTransferResult`

```typescript
const result = await user.accounts.batchTransfer({
  operations: Array<{
    fromUrn: string;
    toUrn: string;
    reference: string;
    amount: string;
    asset: SupportedAsset;
    metadata?: Record<string, unknown>;
  }>;
  reference: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
});
```

**Returns:**

```typescript
{
  chunks: Array<{
    queueId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    message: string;
  }>;
  totalOperations: number;
  totalChunks: number;
}
```

### `user.accounts.movements(params)` → `Movement[]`

```typescript
const movements = await user.accounts.movements({
  urn: string;
  asset?: SupportedAsset;
  limit?: number;
  before?: string;             // ISO 8601
  after?: string;              // ISO 8601
  reference?: string;
  direction?: 'in' | 'out';
  collapsed_view?: boolean;
});
```

**Returns:**

```typescript
Array<{
  amount: string;
  asset: string;
  fromAccountId: string;
  toAccountId: string;
  direction: 'in' | 'out' | 'failed';
  reference: string;
  railName: string;
  status: 'pending' | 'confirmed' | 'settled' | 'cancelled' | 'failed' | 'ignored';
  details: {
    type: string;
    metadata: Record<string, unknown>;  // See transfers.md for metadata shapes
  };
  createdAt: string;
}>
```

---

## CardClient (`user.accounts.card`)

### `user.accounts.card.create(params?, options?)` → `CardAccount`

```typescript
const card = await user.accounts.card.create(
  {
    name?: string;
    webhookUrl?: string;
    ledgerId?: string;         // Links card to a pocket
    metadata?: Record<string, unknown>;
  },
  {
    waitLedger?: boolean;      // Default: false. Wait for ledger provisioning.
    timeout?: number;          // Default: 60000 (ms). Only with waitLedger.
  }
);
```

**Returns: `CardAccount`**

```typescript
{
  urn: string;                 // "did:bloque:account:card:usr-xxx:crd-xxx"
  id: string;
  lastFour: string;            // "1573"
  productType: 'CREDIT' | 'DEBIT';
  status: 'active' | 'disabled' | 'frozen' | 'deleted'
        | 'creation_in_progress' | 'creation_failed';
  cardType: 'VIRTUAL' | 'PHYSICAL';
  detailsUrl: string;          // PCI-compliant URL to view card number/CVV (expires!)
  ownerUrn: string;
  ledgerId: string;
  webhookUrl: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Important — `detailsUrl` expires.** The `detailsUrl` returned from `create()` or `list()` is a signed URL with a limited TTL. To get a fresh, non-expired URL for viewing card details (number, CVV, expiry), call `user.accounts.get()`:

```typescript
const fresh = await user.accounts.get(card.urn);
// fresh.details contains the refreshed detailsUrl
// Use this URL immediately — it will expire again after a short window
```

### `user.accounts.card.list(params?)` → `{ accounts: CardAccount[] }`

```typescript
const result = await user.accounts.card.list();
const result = await user.accounts.card.list({ urn: '...' });
```

**Params (all optional):**

| Param | Type |
|-------|------|
| `holderUrn` | `string` |
| `urn` | `string` |

**Returns:**

```typescript
{
  accounts: Array<CardAccount & {
    balance: Record<string, TokenBalance>;  // Balance included in list
  }>
}
```

**Note:** `balance` is only present in `list()` responses, not in `create()`.

### `user.accounts.card.balance(params)` → `Record<string, TokenBalance>`

```typescript
const balance = await user.accounts.card.balance({ urn: card.urn });
```

**Returns:**

```typescript
{
  "DUSD/6": { current: "50000000", pending: "0", in: "100000000", out: "50000000" }
}
```

### `user.accounts.card.movements(params)` → `CardMovement[]`

```typescript
const movements = await user.accounts.card.movements({
  urn: string;
  asset?: SupportedAsset;
  limit?: number;
  before?: string;
  after?: string;
  reference?: string;
  direction?: 'in' | 'out';
  collapsed_view?: boolean;
});
```

**Returns:** Same shape as `Movement[]` (see `user.accounts.movements`). The `details.metadata` contains card-specific fields like `merchant_name`, `merchant_mcc`, `fee_breakdown`, etc. See `transfers.md` for full metadata shapes.

### `user.accounts.card.updateMetadata(params)` → `CardAccount`

```typescript
const updated = await user.accounts.card.updateMetadata({
  urn: string;
  metadata: Record<string, unknown>;  // Full replacement, not partial
});
```

**Returns:** `CardAccount` (same shape as `create`).

### `user.accounts.card.updateName(urn, name)` → `CardAccount`

```typescript
const updated = await user.accounts.card.updateName(card.urn, 'New Name');
```

**Returns:** `CardAccount` (same shape as `create`).

### `user.accounts.card.activate(urn)` → `CardAccount`

### `user.accounts.card.freeze(urn)` → `CardAccount`

### `user.accounts.card.disable(urn)` → `CardAccount`

All three lifecycle methods return the updated `CardAccount` object.

---

## VirtualClient (`user.accounts.virtual`)

### `user.accounts.virtual.create(params, options?)` → `VirtualAccount`

```typescript
const pocket = await user.accounts.virtual.create(
  {
    name?: string;
    ledgerId?: string;
    webhookUrl?: string;
    metadata?: Record<string, string>;
  },
  { waitLedger?: boolean; timeout?: number }
);
```

**Returns: `VirtualAccount`**

```typescript
{
  urn: string;                 // "did:bloque:account:virtual:xxx"
  id: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'disabled' | 'frozen' | 'deleted'
        | 'creation_in_progress' | 'creation_failed';
  ownerUrn: string;
  ledgerId: string;            // Use this to link cards
  webhookUrl: string | null;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  balance?: Record<string, TokenBalance>;  // Present after waitLedger
}
```

### `user.accounts.virtual.list(params?)` → `{ accounts: VirtualAccount[] }`

```typescript
const result = await user.accounts.virtual.list();
```

**Returns:**

```typescript
{
  accounts: Array<VirtualAccount & {
    balance: Record<string, TokenBalance>;  // Always included in list
  }>
}
```

### `user.accounts.virtual.updateMetadata(params)` → `VirtualAccount`

```typescript
const updated = await user.accounts.virtual.updateMetadata({
  urn: string;
  metadata: Record<string, string>;
});
```

### `user.accounts.virtual.activate(urn)` → `VirtualAccount`

### `user.accounts.virtual.freeze(urn)` → `VirtualAccount`

### `user.accounts.virtual.disable(urn)` → `VirtualAccount`

---

## PolygonClient (`user.accounts.polygon`)

### `user.accounts.polygon.create(params?, options?)` → `PolygonAccount`

```typescript
const polygon = await user.accounts.polygon.create(
  {
    name?: string;
    ledgerId?: string;
    webhookUrl?: string;
    metadata?: Record<string, string>;
  },
  { waitLedger?: boolean; timeout?: number }
);
```

**Returns: `PolygonAccount`**

```typescript
{
  urn: string;
  id: string;
  address: string;             // Polygon wallet address (e.g., "0x05B10c...")
  network: string;             // "polygon"
  status: 'active' | 'disabled' | 'frozen' | 'deleted'
        | 'creation_in_progress' | 'creation_failed';
  ownerUrn: string;
  ledgerId: string;
  webhookUrl: string | null;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  balance?: Record<string, TokenBalance>;
}
```

### `user.accounts.polygon.list(params?)` → `{ accounts: PolygonAccount[] }`

### `user.accounts.polygon.updateMetadata(params)` → `PolygonAccount`

### `user.accounts.polygon.activate(urn)` → `PolygonAccount`

### `user.accounts.polygon.freeze(urn)` → `PolygonAccount`

### `user.accounts.polygon.disable(urn)` → `PolygonAccount`

---

## BancolombiaClient (`user.accounts.bancolombia`)

### `user.accounts.bancolombia.create(params?, options?)` → `BancolombiaAccount`

```typescript
const account = await user.accounts.bancolombia.create(
  {
    name?: string;
    ledgerId?: string;
    webhookUrl?: string;
    metadata?: Record<string, unknown>;
  },
  { waitLedger?: boolean; timeout?: number }
);
```

**Returns: `BancolombiaAccount`**

```typescript
{
  urn: string;
  id: string;
  referenceCode: string;       // Bancolombia reference code for deposits
  status: 'active' | 'disabled' | 'frozen' | 'deleted'
        | 'creation_in_progress' | 'creation_failed';
  ownerUrn: string;
  ledgerId: string;
  webhookUrl: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  balance?: Record<string, TokenBalance>;
}
```

### `user.accounts.bancolombia.list(params?)` → `{ accounts: BancolombiaAccount[] }`

### `user.accounts.bancolombia.updateMetadata(params)` → `BancolombiaAccount`

### `user.accounts.bancolombia.updateName(urn, name)` → `BancolombiaAccount`

### `user.accounts.bancolombia.activate(urn)` → `BancolombiaAccount`

### `user.accounts.bancolombia.freeze(urn)` → `BancolombiaAccount`

### `user.accounts.bancolombia.disable(urn)` → `BancolombiaAccount`

---

## UsClient (`user.accounts.us`)

### `user.accounts.us.getTosLink(params)` → `TosLinkResult`

Must be called before creating a US account. User must accept the TOS.

```typescript
const tos = await user.accounts.us.getTosLink({
  redirectUri: 'https://myapp.com/callback',
});
```

**Returns:**

```typescript
{
  url: string;   // Redirect user here to accept TOS
}
```

### `user.accounts.us.create(params, options?)` → `UsAccount`

```typescript
const account = await user.accounts.us.create({
  type: 'individual' | 'business';
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    streetLine1: string;
    streetLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  birthDate: string;                // 'YYYY-MM-DD'
  taxIdentificationNumber: string;  // SSN or EIN
  govIdCountry: string;             // 'US'
  govIdImageFront: string;          // Base64 image
  signedAgreementId: string;        // From TOS acceptance
  name?: string;
  webhookUrl?: string;
  ledgerId?: string;
  metadata?: Record<string, unknown>;
}, { waitLedger?: boolean; timeout?: number });
```

**Returns: `UsAccount`**

```typescript
{
  urn: string;
  id: string;
  type: 'individual' | 'business';
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    streetLine1: string;
    streetLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  birthDate: string;
  accountNumber?: string;      // Available after provisioning
  routingNumber?: string;      // Available after provisioning
  status: 'active' | 'disabled' | 'frozen' | 'deleted'
        | 'creation_in_progress' | 'creation_failed';
  ownerUrn: string;
  ledgerId: string;
  webhookUrl: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  balance?: Record<string, TokenBalance>;
}
```

### `user.accounts.us.list(params?)` → `{ accounts: UsAccount[] }`

### `user.accounts.us.updateMetadata(params)` → `UsAccount`

### `user.accounts.us.activate(urn)` → `UsAccount`

### `user.accounts.us.freeze(urn)` → `UsAccount`

### `user.accounts.us.disable(urn)` → `UsAccount`

---

## SwapClient (`user.swap`)

### `user.swap.findRates(params)` → `FindRatesResult`

```typescript
const rates = await user.swap.findRates({
  fromAsset: string;        // e.g., 'COP/2'
  toAsset: string;          // e.g., 'DUSD/6'
  fromMediums: string[];    // e.g., ['pse', 'bancolombia']
  toMediums: string[];      // e.g., ['kusama', 'pomelo']
  amountSrc?: string;       // Raw integer string
  amountDst?: string;       // Raw integer string (provide one, not both)
  sort?: 'asc' | 'desc';
  sortBy?: 'rate' | 'at';
});
```

**Returns:**

```typescript
{
  rates: Array<{
    id: string;
    sig: string;             // Use this in order creation
    swapSig: string;
    maker: string;
    edge: [string, string];  // [fromAsset, toAsset]
    fee: {
      at: number;
      value: number;
      formula: string;
      components: Array<{
        at: number;
        name: string;        // e.g., 'take_rate', 'exchange_rate'
        type: 'percentage' | 'rate' | 'fixed';
        value: number | string;
      }>;
    };
    at: string;
    until: string;           // Rate expiration
    fromMediums: string[];
    toMediums: string[];
    rate: [number, number];  // [sourceAmount, destAmount]
    ratio: number;           // Exchange ratio
    fromLimits: [string, string];  // [min, max]
    toLimits: [string, string];    // [min, max]
    createdAt: string;
    updatedAt: string;
  }>
}
```

---

## PseClient (`user.swap.pse`)

### `user.swap.pse.banks()` → `ListBanksResult`

```typescript
const result = await user.swap.pse.banks();
```

**Returns:**

```typescript
{
  banks: Array<{
    code: string;    // Financial institution code
    name: string;    // Financial institution name
  }>
}
```

### `user.swap.pse.create(params)` → `CreatePseOrderResult`

```typescript
const result = await user.swap.pse.create({
  rateSig: string;                      // From findRates
  toMedium: string;                     // e.g., 'kusama'
  amountSrc?: string;
  amountDst?: string;
  type?: 'src' | 'dst';                // Default: 'src'
  depositInformation: { urn: string };  // Account to receive funds
  args: {
    bankCode: string;
    userType: 0 | 1;                    // 0 = natural, 1 = legal
    customerEmail: string;
    userLegalIdType: 'CC' | 'NIT' | 'CE';
    userLegalId: string;
    customerData: { fullName: string; phoneNumber: string };
  };
  nodeId?: string;
  metadata?: Record<string, unknown>;
});
```

**Returns:**

```typescript
{
  order: {
    id: string;
    orderSig: string;
    rateSig: string;
    swapSig: string;
    taker: string;
    maker: string;
    fromAsset: string;
    toAsset: string;
    fromMedium: string;
    toMedium: string;
    fromAmount: string;
    toAmount: string;
    at: string;
    graphId: string;
    status: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  execution?: {
    nodeId: string;
    result: {
      status: string;
      name?: string;
      description?: string;
      how?: {
        type: string;     // e.g., "REDIRECT"
        url: string;      // PSE payment page URL
      };
      callbackToken?: string;
    };
  };
  requestId: string;
}
```

---

## BankTransferClient (`user.swap.bankTransfer`)

### `user.swap.bankTransfer.create(params)` → `CreateBankTransferOrderResult`

```typescript
const result = await user.swap.bankTransfer.create({
  rateSig: string;
  toMedium: SupportedBank;     // e.g., 'bancolombia', 'banco_de_bogota'
  amountSrc?: string;
  amountDst?: string;
  type?: 'src' | 'dst';
  depositInformation: {
    bankAccountType: 'savings' | 'checking';
    bankAccountNumber: string;
    bankAccountHolderName: string;
    bankAccountHolderIdentificationType: 'CC' | 'CE' | 'NIT' | 'PP';
    bankAccountHolderIdentificationValue: string;
  };
  args: { sourceAccountUrn: string };
  nodeId?: string;
  metadata?: Record<string, unknown>;
});
```

**Returns:** Same shape as `CreatePseOrderResult` (order + execution + requestId).

---

## ComplianceClient (`user.compliance`)

### `user.compliance.kyc.start(params)` → `KycVerificationResponse`

```typescript
const result = await user.compliance.kyc.start({
  urn: string;             // User URN
  webhookUrl?: string;     // Status update notifications
});
```

**Returns:**

```typescript
{
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
  url: string;             // URL for user to complete KYC
  completedAt: string | null;
}
```

### `user.compliance.kyc.get(params)` → `KycVerificationResponse`

```typescript
const status = await user.compliance.kyc.get({ urn: string });
```

**Returns:** Same shape as `kyc.start`.

---

## OrgsClient (`user.orgs`)

### `user.orgs.create(params)` → `Organization`

```typescript
const org = await user.orgs.create({
  org_type: 'business' | 'individual';
  profile: {
    legal_name: string;
    tax_id: string;
    incorporation_date: string;
    business_type: string;
    incorporation_country_code: string;
    address_line1: string;
    postal_code: string;
    city: string;
    state: string;
    // ... optional fields
  };
  metadata?: Record<string, unknown>;
});
```

**Returns:**

```typescript
{
  urn: string;
  org_type: 'business' | 'individual';
  profile: OrgProfile;        // Same shape as input
  metadata?: Record<string, unknown>;
  status: 'awaiting_compliance_verification' | 'active' | 'suspended' | 'closed';
}
```

---

## Shared Types

### `TokenBalance`

```typescript
{
  current: string;    // Available balance right now
  pending: string;    // Reserved for pending transactions
  in: string;         // Total incoming (all time)
  out: string;        // Total outgoing (all time)
}
```

### `SupportedAsset`

```typescript
'DUSD/6' | 'COPB/6' | 'COPM/2' | 'KSM/12'
```

### `AccountStatus`

```typescript
'active' | 'disabled' | 'frozen' | 'deleted' | 'creation_in_progress' | 'creation_failed'
```

### `TransactionStatus`

```typescript
'pending' | 'cancelled' | 'confirmed' | 'settled' | 'failed' | 'ignored'
```

### `CreateAccountOptions`

Used by all `create()` methods:

```typescript
{
  waitLedger?: boolean;   // Default: false. Poll until active.
  timeout?: number;       // Default: 60000 (ms). Max wait time.
}
```

**Important:** Always pass `{ waitLedger: true }` when you need `ledgerId` immediately after creation (e.g., to create a card linked to a pocket).
