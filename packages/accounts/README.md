# @bloque/sdk-accounts

Financial accounts and payment methods client for the [Bloque](https://www.bloque.app) platform.

## Features

- **Virtual Cards**: Create virtual cards instantly
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
});

console.log('Card created:', card.urn);
console.log('Last four digits:', card.lastFour);
console.log('Card details URL:', card.detailsUrl);
console.log('Status:', card.status);
```

## API Reference

### Card Accounts

Create virtual cards instantly.

#### `card.create(params)`

```typescript
const card = await bloque.accounts.card.create({
  urn: 'did:bloque:user:123',
  name: 'My Virtual Card', // Optional
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
  webhookUrl: string | null;      // Webhook URL (if configured)
  metadata?: Record<string, unknown>; // Custom metadata
  createdAt: string;              // Creation timestamp (ISO 8601)
  updatedAt: string;              // Last update timestamp (ISO 8601)
}
```

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

## TypeScript Support

This package is written in TypeScript and includes complete type definitions:

```typescript
import type {
  CardAccount,
  CreateCardParams,
} from '@bloque/sdk-accounts';

// Type-safe card creation
const params: CreateCardParams = {
  urn: 'did:bloque:user:123e4567',
  name: 'My Card', // Optional
};

const card: CardAccount = await bloque.accounts.card.create(params);

// TypeScript infers all card properties with full type safety
console.log(card.lastFour); // string
console.log(card.status);   // 'active' | 'disabled' | 'frozen' | 'deleted' | 'creation_in_progress' | 'creation_failed'
console.log(card.cardType); // 'VIRTUAL' | 'PHYSICAL'
```

## Card Status

Cards have a status field indicating their current state:

- `creation_in_progress`: Card is being created
- `creation_failed`: Card creation failed
- `active`: Card is active and ready to use
- `disabled`: Card has been disabled
- `frozen`: Card has been temporarily frozen
- `deleted`: Card has been deleted

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
