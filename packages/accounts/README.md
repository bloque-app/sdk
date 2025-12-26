# @bloque/sdk-accounts

Financial accounts and payment methods client for the [Bloque](https://www.bloque.app) platform.

## Features

- **Virtual Cards**: Create virtual cards instantly
- **Bancolombia Accounts**: Create Bancolombia accounts with reference codes
- **TypeScript First**: Built with TypeScript for complete type safety
- **Simple API**: Minimal input required - just URN and optional name
- **Fully Async**: Promise-based API for modern JavaScript workflows
- **Secure**: PCI-compliant card details URL

## Installation

This package is included in the main `@bloque/sdk` package. You typically don't need to install it separately.

```bash
bun add @bloque/sdk
```

If you need to use this package standalone:

```bash
bun add @bloque/sdk-accounts @bloque/sdk-core
```

## Usage

### With the Main SDK (Recommended)

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Create a virtual card
const card = await bloque.accounts.card.create({
  urn: 'did:bloque:user:123',
  name: 'My Virtual Card', // Optional
  ledgerId: 'ledger_123', // Optional - associate with ledger account
});

console.log('Card created:', card.urn);
console.log('Last four digits:', card.lastFour);
console.log('Card details URL:', card.detailsUrl);
console.log('Ledger ID:', card.ledgerId);
console.log('Status:', card.status);

// Create a Bancolombia account
const bancolombiaAccount = await bloque.accounts.bancolombia.create({
  urn: 'did:bloque:user:123',
  name: 'Main Account', // Optional
  ledgerId: 'ledger_123', // Optional - associate with ledger account
});

console.log('Bancolombia account created:', bancolombiaAccount.urn);
console.log('Reference code:', bancolombiaAccount.referenceCode);
console.log('Ledger ID:', bancolombiaAccount.ledgerId);
console.log('Status:', bancolombiaAccount.status);
```

## API Reference

### Card Accounts

Create virtual cards instantly.

#### `card.create(params)`

```typescript
const card = await bloque.accounts.card.create({
  urn: 'did:bloque:user:123',
  name: 'My Virtual Card', // Optional
  ledgerId: 'ledger_123', // Optional
});
```

**Parameters**:

```typescript
interface CreateCardParams {
  /**
   * URN of the account holder (user or organization)
   * @example "did:bloque:user:123e4567"
   */
  urn: string;

  /**
   * Display name for the card (optional)
   */
  name?: string;

  /**
   * Ledger account ID to associate with the card (optional)
   */
  ledgerId?: string;

  /**
   * Webhook URL to receive card events (optional)
   */
  webhookUrl?: string;

  /**
   * Custom metadata to associate with the card (optional)
   */
  metadata?: Record<string, unknown>;
}
```

**Returns**:

```typescript
interface CardAccount {
  urn: string;                    // Unique resource name
  id: string;                     // Card account ID
  lastFour: string;               // Last four digits
  productType: 'CREDIT' | 'DEBIT'; // Card product type
  status: 'active' | 'disabled' | 'frozen' | 'deleted' | 'creation_in_progress' | 'creation_failed';
  cardType: 'VIRTUAL' | 'PHYSICAL'; // Card type
  detailsUrl: string;             // PCI-compliant URL to view card details
  ownerUrn: string;               // Owner URN
  ledgerId: string;               // Ledger account ID
  webhookUrl: string | null;      // Webhook URL (if configured)
  metadata?: Record<string, unknown>; // Custom metadata
  createdAt: string;              // Creation timestamp (ISO 8601)
  updatedAt: string;              // Last update timestamp (ISO 8601)
}
```

#### `card.updateMetadata(params)`

Update the metadata of an existing card account.

```typescript
const card = await bloque.accounts.card.updateMetadata({
  urn: 'did:bloque:mediums:card:account:123',
  metadata: {
    updated_by: 'admin',
    update_reason: 'customer_request',
  },
});
```

**Parameters**:

```typescript
interface UpdateCardMetadataParams {
  /**
   * URN of the card account to update
   * @example "did:bloque:mediums:card:account:123e4567"
   */
  urn: string;

  /**
   * Metadata to update (name and source are reserved fields and cannot be modified)
   */
  metadata: Record<string, unknown> & {
    name?: never;
    source?: never;
  };
}
```

**Returns**: `CardAccount`

#### `card.activate(urn)`

Activate a card account.

```typescript
const card = await bloque.accounts.card.activate(
  'did:bloque:mediums:card:account:123'
);
```

**Parameters**: `urn: string` - Card account URN

**Returns**: `CardAccount`

#### `card.freeze(urn)`

Freeze a card account.

```typescript
const card = await bloque.accounts.card.freeze(
  'did:bloque:mediums:card:account:123'
);
```

**Parameters**: `urn: string` - Card account URN

**Returns**: `CardAccount`

#### `card.disable(urn)`

Disable a card account.

```typescript
const card = await bloque.accounts.card.disable(
  'did:bloque:mediums:card:account:123'
);
```

**Parameters**: `urn: string` - Card account URN

**Returns**: `CardAccount`

### Bancolombia Accounts

Create Bancolombia accounts with reference codes for local payments.

#### `bancolombia.create(params)`

```typescript
const account = await bloque.accounts.bancolombia.create({
  urn: 'did:bloque:user:123',
  name: 'Main Account', // Optional
  ledgerId: 'ledger_123', // Optional
});
```

**Parameters**:

```typescript
interface CreateBancolombiaAccountParams {
  /**
   * URN of the account holder (user or organization)
   * @example "did:bloque:user:123e4567"
   */
  urn: string;

  /**
   * Display name for the account (optional)
   */
  name?: string;

  /**
   * Ledger account ID to associate with the Bancolombia account (optional)
   */
  ledgerId?: string;

  /**
   * Webhook URL to receive account events (optional)
   */
  webhookUrl?: string;

  /**
   * Custom metadata to attach to the Bancolombia account (optional)
   */
  metadata?: Record<string, unknown>;
}
```

**Returns**:

```typescript
interface BancolombiaAccount {
  urn: string;                    // Unique resource name
  id: string;                     // Account ID
  referenceCode: string;          // Reference code for payments
  status: 'active' | 'disabled' | 'frozen' | 'deleted' | 'creation_in_progress' | 'creation_failed';
  ownerUrn: string;               // Owner URN
  ledgerId: string;               // Ledger account ID
  webhookUrl: string | null;      // Webhook URL (if configured)
  metadata?: Record<string, unknown>; // Custom metadata
  createdAt: string;              // Creation timestamp (ISO 8601)
  updatedAt: string;              // Last update timestamp (ISO 8601)
}
```

#### `bancolombia.updateMetadata(params)`

Update the metadata of an existing Bancolombia account.

```typescript
const account = await bloque.accounts.bancolombia.updateMetadata({
  urn: 'did:bloque:mediums:bancolombia:account:123',
  metadata: {
    updated_by: 'admin',
    update_reason: 'customer_request',
  },
});
```

**Parameters**:

```typescript
interface UpdateBancolombiaMetadataParams {
  /**
   * URN of the Bancolombia account to update
   * @example "did:bloque:mediums:bancolombia:account:123e4567"
   */
  urn: string;

  /**
   * Metadata to update (name and source are reserved fields and cannot be modified)
   */
  metadata: Record<string, unknown> & {
    name?: never;
    source?: never;
  };
}
```

**Returns**: `BancolombiaAccount`

#### `bancolombia.activate(urn)`

Activate a Bancolombia account.

```typescript
const account = await bloque.accounts.bancolombia.activate(
  'did:bloque:mediums:bancolombia:account:123'
);
```

**Parameters**: `urn: string` - Bancolombia account URN

**Returns**: `BancolombiaAccount`

#### `bancolombia.freeze(urn)`

Freeze a Bancolombia account.

```typescript
const account = await bloque.accounts.bancolombia.freeze(
  'did:bloque:mediums:bancolombia:account:123'
);
```

**Parameters**: `urn: string` - Bancolombia account URN

**Returns**: `BancolombiaAccount`

#### `bancolombia.disable(urn)`

Disable a Bancolombia account.

```typescript
const account = await bloque.accounts.bancolombia.disable(
  'did:bloque:mediums:bancolombia:account:123'
);
```

**Parameters**: `urn: string` - Bancolombia account URN

**Returns**: `BancolombiaAccount`

## Complete Examples

### Basic Card Creation

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Create a virtual card with just URN
const card = await bloque.accounts.card.create({
  urn: 'did:bloque:user:123e4567',
});

console.log('Card created:', card.urn);
console.log('Last four:', card.lastFour);
console.log('Status:', card.status);
```

### Card Creation with Name

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Create a named virtual card
const card = await bloque.accounts.card.create({
  urn: 'did:bloque:user:123e4567',
  name: 'My Business Card',
});

console.log('Card name:', card.metadata?.name);
console.log('Card details URL:', card.detailsUrl);
```

### Creating Multiple Cards

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

const userUrn = 'did:bloque:user:123e4567';

// Create multiple cards for the same user
const personalCard = await bloque.accounts.card.create({
  urn: userUrn,
  name: 'Personal Card',
});

const businessCard = await bloque.accounts.card.create({
  urn: userUrn,
  name: 'Business Card',
});

console.log('Personal card:', personalCard.lastFour);
console.log('Business card:', businessCard.lastFour);
```

### Updating Card Metadata

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Create a card first
const card = await bloque.accounts.card.create({
  urn: 'did:bloque:user:123e4567',
  name: 'My Card',
});

// Update the card metadata
const updatedCard = await bloque.accounts.card.updateMetadata({
  urn: card.urn,
  metadata: {
    updated_by: 'admin',
    update_reason: 'customer_request',
    custom_field: 'custom_value',
  },
});

console.log('Card metadata updated:', updatedCard.metadata);
```

### Updating Card Status

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Freeze a card
const frozenCard = await bloque.accounts.card.freeze(
  'did:bloque:mediums:card:account:123'
);

console.log('Card status:', frozenCard.status); // 'frozen'

// Reactivate the card
const activeCard = await bloque.accounts.card.activate(
  'did:bloque:mediums:card:account:123'
);

console.log('Card status:', activeCard.status); // 'active'

// Disable a card
const disabledCard = await bloque.accounts.card.disable(
  'did:bloque:mediums:card:account:123'
);

console.log('Card status:', disabledCard.status); // 'disabled'
```

### Error Handling

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

try {
  const card = await bloque.accounts.card.create({
    urn: 'did:bloque:user:123e4567',
    name: 'My Card',
  });

  console.log('Card created successfully:', card.urn);

  // Check if card is ready to use
  if (card.status === 'active') {
    console.log('Card is active and ready to use!');
  } else if (card.status === 'creation_in_progress') {
    console.log('Card is being created...');
  }
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to create card:', error.message);
  }
}
```

### Basic Bancolombia Account Creation

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Create a Bancolombia account with just URN
const account = await bloque.accounts.bancolombia.create({
  urn: 'did:bloque:user:123e4567',
});

console.log('Account created:', account.urn);
console.log('Reference code:', account.referenceCode);
console.log('Status:', account.status);
```

### Bancolombia Account with Ledger Association

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

const userUrn = 'did:bloque:user:123e4567';
const ledgerId = 'ledger_abc123';

// Create a card associated with a ledger
const card = await bloque.accounts.card.create({
  urn: userUrn,
  name: 'My Card',
  ledgerId: ledgerId,
});

// Create Bancolombia account with the same ledger
const account = await bloque.accounts.bancolombia.create({
  urn: userUrn,
  name: 'Main Account',
  ledgerId: ledgerId,
});

console.log('Card URN:', card.urn);
console.log('Card Ledger ID:', card.ledgerId);
console.log('Account URN:', account.urn);
console.log('Account Ledger ID:', account.ledgerId);
console.log('Reference code for payments:', account.referenceCode);
```

### Bancolombia Account with Metadata

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Create Bancolombia account with custom metadata
const account = await bloque.accounts.bancolombia.create({
  urn: 'did:bloque:user:123e4567',
  name: 'Business Account',
  metadata: {
    purpose: 'business-payments',
    department: 'sales',
    customField: 'custom-value',
  },
});

console.log('Account created with metadata:', account.metadata);
console.log('Reference code:', account.referenceCode);
```

### Updating Bancolombia Account Metadata

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Create a Bancolombia account first
const account = await bloque.accounts.bancolombia.create({
  urn: 'did:bloque:user:123e4567',
  name: 'Main Account',
});

// Update the account metadata
const updatedAccount = await bloque.accounts.bancolombia.updateMetadata({
  urn: account.urn,
  metadata: {
    updated_by: 'admin',
    update_reason: 'customer_request',
    department: 'finance',
  },
});

console.log('Account metadata updated:', updatedAccount.metadata);
```

### Updating Bancolombia Account Status

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// Freeze a Bancolombia account
const frozenAccount = await bloque.accounts.bancolombia.freeze(
  'did:bloque:mediums:bancolombia:account:123'
);

console.log('Account status:', frozenAccount.status); // 'frozen'

// Reactivate the account
const activeAccount = await bloque.accounts.bancolombia.activate(
  'did:bloque:mediums:bancolombia:account:123'
);

console.log('Account status:', activeAccount.status); // 'active'

// Disable an account
const disabledAccount = await bloque.accounts.bancolombia.disable(
  'did:bloque:mediums:bancolombia:account:123'
);

console.log('Account status:', disabledAccount.status); // 'disabled'
```

## TypeScript Support

This package is written in TypeScript and includes complete type definitions:

```typescript
import type {
  CardAccount,
  CreateCardParams,
  UpdateCardMetadataParams,
  BancolombiaAccount,
  CreateBancolombiaAccountParams,
  UpdateBancolombiaMetadataParams,
} from '@bloque/sdk-accounts';

// Type-safe card creation
const cardParams: CreateCardParams = {
  urn: 'did:bloque:user:123e4567',
  name: 'My Card', // Optional
};

const card: CardAccount = await bloque.accounts.card.create(cardParams);

// TypeScript infers all card properties with full type safety
console.log(card.lastFour); // string
console.log(card.status);   // 'active' | 'disabled' | 'frozen' | 'deleted' | 'creation_in_progress' | 'creation_failed'
console.log(card.cardType); // 'VIRTUAL' | 'PHYSICAL'

// Type-safe Bancolombia account creation
const accountParams: CreateBancolombiaAccountParams = {
  urn: 'did:bloque:user:123e4567',
  name: 'Main Account', // Optional
  ledgerId: 'ledger_123', // Optional
};

const account: BancolombiaAccount = await bloque.accounts.bancolombia.create(accountParams);

// TypeScript infers all account properties with full type safety
console.log(account.referenceCode); // string
console.log(account.ledgerId);      // string
console.log(account.status);        // 'active' | 'disabled' | 'frozen' | 'deleted' | 'creation_in_progress' | 'creation_failed'
```

## Account Status

Both cards and Bancolombia accounts have a status field indicating their current state:

- `creation_in_progress`: Account/card is being created
- `creation_failed`: Account/card creation failed
- `active`: Account/card is active and ready to use
- `disabled`: Account/card has been disabled
- `frozen`: Account/card has been temporarily frozen
- `deleted`: Account/card has been deleted

## Requirements

- Node.js 22.x or higher / Bun 1.x or higher
- TypeScript 5.x or higher (for TypeScript projects)

## Links

- [Homepage](https://www.bloque.app)
- [Main SDK Documentation](../sdk/README.md)
- [GitHub Repository](https://github.com/bloque-app/sdk)
- [Issue Tracker](https://github.com/bloque-app/sdk/issues)

## License

[MIT](../../LICENSE)

Copyright (c) 2025-present Bloque Copilot Inc.
