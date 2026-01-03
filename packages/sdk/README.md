# Bloque SDK

The official TypeScript/JavaScript SDK for integrating [Bloque](https://www.bloque.app) into your applications.

> **⚠️ Development Notice**
>
> This SDK is currently under active development. Breaking changes may occur between versions.
> We strongly recommend pinning to a specific version in your `package.json` to avoid unexpected issues.
>
> ```json
> {
>   "dependencies": {
>     "@bloque/sdk": "x.x.x"
>   }
> }
> ```
>
> Replace with the latest version from [npm](https://www.npmjs.com/package/@bloque/sdk).

## Platform Support

This SDK is compatible with multiple JavaScript runtimes:

- **Node.js** 22.x or higher
- **Bun** 1.x or higher
- **Deno** Latest version
- **Web/Browsers** Modern browsers with ES2020+ support
- **React Native** Latest version

## Features

- **TypeScript First**: Built with TypeScript for complete type safety
- **Modular Architecture**: Import only what you need - accounts, identity, compliance, or organizations
- **Multi-Runtime**: Works seamlessly across Node.js, Bun, Deno, browsers, and React Native
- **Account Management**: Create and manage virtual cards, virtual accounts, Polygon wallets, and Bancolombia accounts
- **Identity System**: Register individual users (KYC) and businesses (KYB) with multi-method authentication
- **Compliance Ready**: Built-in KYC/KYB verification workflows
- **Transfer System**: Transfer funds between accounts with multiple asset support
- **Production Ready**:
  - ✅ Automatic retry with exponential backoff
  - ✅ Configurable timeouts (default: 30s)
  - ✅ Specific error types for better error handling
  - ✅ Request ID tracking for debugging
  - ✅ Security warnings for insecure practices
- **Lightweight**: Minimal dependencies for optimal bundle size
- **Fully Async**: Promise-based API for modern JavaScript workflows

## Installation

```bash
# npm
npm install @bloque/sdk

# bun
bun add @bloque/sdk

# pnpm
pnpm add @bloque/sdk

# yarn
yarn add @bloque/sdk
```

## Quick Start

### Backend (Node.js, Bun, Deno)

```typescript
import { SDK } from '@bloque/sdk';

// Initialize the SDK with API key (backend only)
const bloque = new SDK({
  origin: 'your-origin-name',
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production', // or 'sandbox' for testing
  platform: 'node', // optional: 'node' | 'bun' | 'deno'
  timeout: 30000, // optional: request timeout in ms
  retry: { // optional: retry configuration
    enabled: true,
    maxRetries: 3,
    initialDelay: 1000,
  },
});

// Connect to user session
const session = await bloque.connect('did:bloque:your-origin:user-alias');

// Create a virtual card
const card = await session.accounts.card.create({
  name: 'My Virtual Card',
});

console.log('Card created:', card.urn);
console.log('Last four digits:', card.lastFour);
```

### Frontend (Browser, React Native)

```typescript
import { SDK } from '@bloque/sdk';

// Initialize the SDK with JWT authentication
const bloque = new SDK({
  origin: 'your-origin-name',
  auth: { type: 'jwt' },
  mode: 'production',
  platform: 'browser', // or 'react-native'
  // For browser: uses localStorage by default (with security warning)
  // For react-native: provide custom tokenStorage
  tokenStorage: {
    get: () => {
      // Your secure storage implementation
      return AsyncStorage.getItem('bloque_token');
    },
    set: (token) => {
      AsyncStorage.setItem('bloque_token', token);
    },
    clear: () => {
      AsyncStorage.removeItem('bloque_token');
    },
  },
});

// Register a new user
const result = await bloque.identity.origins.register(
  'did:bloque:your-origin:ethereum-mainnet',
  {
    assertionResult: { /* signing challenge result */ },
    type: 'individual',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  }
);

// The JWT is automatically stored and used for subsequent requests
```

## Configuration

### Full Configuration Options

```typescript
interface BloqueSDKConfig {
  // Required
  origin: string; // Your origin identifier
  auth: AuthStrategy; // Authentication strategy

  // Optional
  platform?: Platform; // Runtime platform (default: 'node')
  mode?: Mode; // Environment mode (default: 'production')
  timeout?: number; // Request timeout in ms (default: 30000)
  tokenStorage?: TokenStorage; // JWT storage (required for react-native)
  retry?: RetryConfig; // Retry configuration
}

// Authentication strategies
type AuthStrategy =
  | { type: 'apiKey'; apiKey: string } // Backend only
  | { type: 'jwt' }; // Frontend (browser/react-native)

// Platforms
type Platform = 'node' | 'bun' | 'deno' | 'browser' | 'react-native';

// Modes
type Mode = 'production' | 'sandbox';

// Retry configuration
interface RetryConfig {
  enabled?: boolean; // default: true
  maxRetries?: number; // default: 3
  initialDelay?: number; // default: 1000ms
  maxDelay?: number; // default: 30000ms
}
```

## SDK Structure

After connecting to a user session, you have access to these clients:

```typescript
const session = await bloque.connect('did:bloque:your-origin:user-alias');

// Available clients
session.accounts    // Account management
session.identity    // Identity and aliases
session.compliance  // KYC/KYB verification
session.orgs        // Organization management
```

## Accounts Client

The accounts client provides access to multiple account types:

### Virtual Cards

```typescript
// Create a virtual card
const card = await session.accounts.card.create({
  name: 'My Card',
  webhookUrl: 'https://your-app.com/webhooks/card',
});

// List cards
const cards = await session.accounts.card.list();

// Check balance
const balance = await session.accounts.card.balance({
  urn: card.urn,
});

// Get movements/transactions
const movements = await session.accounts.card.movements({
  urn: card.urn,
  asset: 'DUSD/6',
  limit: 50,
  direction: 'in', // 'in' | 'out'
});

// Update card
const updated = await session.accounts.card.updateMetadata({
  urn: card.urn,
  metadata: { name: 'Updated Name' },
});

// Manage card state
await session.accounts.card.activate(card.urn);
await session.accounts.card.freeze(card.urn);
await session.accounts.card.disable(card.urn);
```

### Virtual Accounts

Virtual accounts are simple testing accounts requiring only basic personal information:

```typescript
// Create a virtual account
const account = await session.accounts.virtual.create({
  firstName: 'John',
  lastName: 'Doe',
  metadata: {
    environment: 'testing',
    purpose: 'integration-test',
  },
});

// Update metadata
await session.accounts.virtual.updateMetadata({
  urn: account.urn,
  metadata: { updated_by: 'admin' },
});

// Manage account state
await session.accounts.virtual.activate(account.urn);
await session.accounts.virtual.freeze(account.urn);
await session.accounts.virtual.disable(account.urn);
```

### Polygon Wallets

Cryptocurrency wallets on the Polygon network for Web3 transactions:

```typescript
// Create a Polygon wallet (no additional input required)
const wallet = await session.accounts.polygon.create({
  metadata: {
    purpose: 'web3-transactions',
    project: 'my-dapp',
  },
});

console.log('Wallet address:', wallet.address);
console.log('Network:', wallet.network); // "polygon"

// Update metadata
await session.accounts.polygon.updateMetadata({
  urn: wallet.urn,
  metadata: { environment: 'production' },
});

// Manage account state
await session.accounts.polygon.activate(wallet.urn);
await session.accounts.polygon.freeze(wallet.urn);
await session.accounts.polygon.disable(wallet.urn);
```

### Bancolombia Accounts

Colombian virtual accounts with unique reference code system:

```typescript
// Create a Bancolombia account
const account = await session.accounts.bancolombia.create({
  name: 'Main Account',
  webhookUrl: 'https://your-app.com/webhooks/bancolombia',
});

console.log('Reference code:', account.referenceCode);

// Update metadata or name
await session.accounts.bancolombia.updateMetadata({
  urn: account.urn,
  metadata: { category: 'savings' },
});

await session.accounts.bancolombia.updateName(account.urn, 'Savings Account');

// Manage account state
await session.accounts.bancolombia.activate(account.urn);
await session.accounts.bancolombia.freeze(account.urn);
await session.accounts.bancolombia.disable(account.urn);
```

### Transfers

Transfer funds between any account types:

```typescript
const result = await session.accounts.transfer({
  sourceUrn: 'did:bloque:account:card:usr-123:crd-456',
  destinationUrn: 'did:bloque:account:virtual:acc-789',
  amount: '1000000', // Amount in smallest unit
  asset: 'DUSD/6', // 'DUSD/6' | 'KSM/12'
  metadata: {
    description: 'Payment for services',
  },
});

console.log('Transfer queued:', result.queueId);
console.log('Status:', result.status); // 'queued' | 'processing' | 'completed' | 'failed'
```

## Identity Client

Manage user identities and authentication:

```typescript
// Get alias information
const alias = await session.identity.aliases.get('user@example.com');

// List available origins
const origins = await session.identity.origins.list();

// Register a new identity (individual)
const result = await bloque.identity.origins.register(
  'did:bloque:your-origin:ethereum-mainnet',
  {
    assertionResult: {
      alias: '0x742d35Cc...',
      challengeType: 'SIGNING_CHALLENGE',
      value: {
        signature: '0x...',
        alias: '0x742d35Cc...',
      },
    },
    type: 'individual',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      birthdate: '1990-01-15',
      countryOfResidenceCode: 'US',
    },
  }
);

// Register a business
const businessResult = await bloque.identity.origins.register(
  'did:bloque:your-origin:ethereum-mainnet',
  {
    assertionResult: { /* ... */ },
    type: 'business',
    profile: {
      legalName: 'Acme Corporation',
      taxId: '123456789',
      incorporationDate: '2020-01-01',
      type: 'llc',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postalCode: '12345',
      // ... other required fields
    },
  }
);

// OTP-based authentication
const otpEmail = await bloque.identity.origins.email.assert('user@example.com');
const otpWhatsApp = await bloque.identity.origins.whatsapp.assert('+1234567890');
const otpCustom = await bloque.identity.origins.custom('my-origin').assert('user-id');
```

## Compliance Client

KYC/KYB verification workflows:

```typescript
// Start KYC verification
const verification = await session.compliance.kyc.startVerification({
  urn: 'did:bloque:user:123e4567',
  webhookUrl: 'https://your-app.com/webhooks/kyc',
});

console.log('Verification URL:', verification.url);
console.log('Status:', verification.status);

// Get verification status
const status = await session.compliance.kyc.getVerification({
  urn: 'did:bloque:user:123e4567',
});

console.log('Status:', status.status);
console.log('Completed at:', status.completedAt);
```

## Organizations Client

Create and manage organizations:

```typescript
const org = await session.orgs.create({
  org_type: 'business',
  profile: {
    legal_name: 'Acme Corporation',
    tax_id: '123456789',
    incorporation_date: '2020-01-01',
    business_type: 'llc',
    incorporation_country_code: 'US',
    incorporation_state: 'CA',
    address_line1: '123 Main St',
    address_line2: 'Suite 100',
    postal_code: '12345',
    city: 'San Francisco',
  },
  metadata: {
    industry: 'technology',
  },
});

console.log('Organization created:', org.urn);
console.log('Status:', org.status);
```

## Error Handling

The SDK provides specific error types for better error handling:

```typescript
import {
  BloqueRateLimitError,
  BloqueAuthenticationError,
  BloqueValidationError,
  BloqueNotFoundError,
  BloqueInsufficientFundsError,
  BloqueNetworkError,
  BloqueTimeoutError,
} from '@bloque/sdk';

try {
  const card = await session.accounts.card.create({ name: 'My Card' });
} catch (error) {
  if (error instanceof BloqueRateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    console.log(`Request ID: ${error.requestId}`);
  } else if (error instanceof BloqueValidationError) {
    console.log('Validation errors:', error.validationErrors);
  } else if (error instanceof BloqueAuthenticationError) {
    console.log('Authentication failed. Check your API key.');
  } else if (error instanceof BloqueNotFoundError) {
    console.log(`Resource not found: ${error.resourceType}`);
  } else if (error instanceof BloqueInsufficientFundsError) {
    console.log(`Insufficient funds: ${error.requestedAmount} ${error.currency}`);
    console.log(`Available: ${error.availableBalance} ${error.currency}`);
  } else if (error instanceof BloqueTimeoutError) {
    console.log(`Request timed out after ${error.timeoutMs}ms`);
  } else if (error instanceof BloqueNetworkError) {
    console.log('Network error:', error.message);
  }

  // All errors have these fields
  console.log('Error details:', error.toJSON());
}
```

### Error Metadata

All errors include rich metadata for debugging:

- `message`: Human-readable error message
- `status`: HTTP status code (if applicable)
- `code`: Error code from the API
- `requestId`: Unique request ID for tracing
- `timestamp`: When the error occurred
- `response`: Original response body (for debugging)
- `cause`: Original error (for error chaining)

## Retry Logic

The SDK automatically retries failed requests with exponential backoff:

- **Retried scenarios**: 429 (Rate Limit), 503 (Service Unavailable), network errors, timeouts
- **Exponential backoff**: Delay increases exponentially (1s → 2s → 4s)
- **Jitter**: ±25% random jitter to prevent thundering herd
- **Respects Retry-After**: Honors the `Retry-After` header when present

```typescript
const bloque = new SDK({
  origin: 'your-origin',
  auth: { type: 'apiKey', apiKey: 'key' },
  retry: {
    enabled: true, // default: true
    maxRetries: 3, // default: 3
    initialDelay: 1000, // default: 1000ms
    maxDelay: 30000, // default: 30000ms
  },
});
```

## Timeout Configuration

Configure request timeouts globally or per-request:

```typescript
// Global timeout
const bloque = new SDK({
  origin: 'your-origin',
  auth: { type: 'apiKey', apiKey: 'key' },
  timeout: 15000, // 15 seconds
});

// Per-request timeout (override global)
const card = await session.accounts.card.create(
  { name: 'My Card' },
  { timeout: 5000 } // 5 seconds for this request
);
```

## Security Best Practices

### API Keys

- ✅ Store API keys in environment variables
- ✅ Use different keys for development and production
- ✅ Never commit API keys to version control
- ✅ Rotate API keys regularly
- ❌ Never expose API keys in client-side code

### Token Storage (Frontend)

The SDK warns when using insecure storage:

```typescript
// Browser: localStorage (⚠️ vulnerable to XSS)
const bloque = new SDK({
  auth: { type: 'jwt' },
  platform: 'browser',
  // Uses localStorage by default with security warning
});

// Recommended: httpOnly cookies (immune to XSS)
const cookieStorage: TokenStorage = {
  get: () => null, // Token sent automatically in cookie
  set: async (token) => {
    await fetch('/api/auth/set-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
  clear: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
  },
};

const bloque = new SDK({
  auth: { type: 'jwt' },
  platform: 'browser',
  tokenStorage: cookieStorage,
});
```

## TypeScript Support

The SDK is built with TypeScript and provides full type safety:

```typescript
import type {
  BloqueSDKConfig,
  CardAccount,
  CreateCardParams,
  VirtualAccount,
  CreateVirtualAccountParams,
  PolygonAccount,
  CreatePolygonAccountParams,
  TransferParams,
  TransferResult,
} from '@bloque/sdk';

// Type-safe configuration
const config: BloqueSDKConfig = {
  origin: 'your-origin',
  auth: { type: 'apiKey', apiKey: 'key' },
  mode: 'production',
};

// Type-safe parameters
const params: CreateCardParams = {
  name: 'My Card',
};

// Type-safe responses
const card: CardAccount = await session.accounts.card.create(params);
```

## Package Exports

The SDK supports modular imports:

```typescript
// Main SDK
import { SDK } from '@bloque/sdk';

// Initialization helper
import { init } from '@bloque/sdk/init';

// Modular clients (tree-shakeable)
import { AccountsClient } from '@bloque/sdk/accounts';
import { IdentityClient } from '@bloque/sdk/identity';
import { ComplianceClient } from '@bloque/sdk/compliance';
import { OrgsClient } from '@bloque/sdk/orgs';

// Types
import type {
  BloqueSDKConfig,
  CardAccount,
  VirtualAccount,
  PolygonAccount,
  BancolombiaAccount,
} from '@bloque/sdk';
```

## Advanced Usage

### Custom HTTP Client

For advanced use cases, access the HTTP client directly:

```typescript
const session = await bloque.connect('did:bloque:your-origin:user-alias');

// Access the HTTP client
const httpClient = session.accounts.card['httpClient'];

// Make custom requests
const response = await httpClient.request({
  method: 'GET',
  path: '/api/custom-endpoint',
  timeout: 10000,
});
```

### Environment-Specific Configuration

```typescript
const config: BloqueSDKConfig = {
  origin: process.env.BLOQUE_ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  platform: 'node',
  timeout: Number.parseInt(process.env.BLOQUE_TIMEOUT || '30000', 10),
  retry: {
    enabled: process.env.BLOQUE_RETRY_ENABLED !== 'false',
    maxRetries: Number.parseInt(process.env.BLOQUE_MAX_RETRIES || '3', 10),
  },
};

const bloque = new SDK(config);
```

## Examples

See the [`examples/`](./examples) directory for complete working examples:

- `basic-usage.ts` - Basic SDK usage
- `virtual-cards.ts` - Virtual card management
- `virtual-accounts.ts` - Virtual account management
- `transfers.ts` - Account transfers
- `identity-registration.ts` - User registration
- `kyc-verification.ts` - KYC workflows
- `error-handling.ts` - Advanced error handling

## API Documentation

For detailed API documentation, visit [docs.bloque.app/sdk](https://docs.bloque.app/sdk).

## Support

- 📧 Email: [support@bloque.app](mailto:support@bloque.app)
- 💬 Discord: [discord.gg/bloque](https://discord.gg/bloque)
- 📖 Docs: [docs.bloque.app](https://docs.bloque.app)
- 🐛 Issues: [GitHub Issues](https://github.com/bloque/sdk/issues)

## License

MIT © [Bloque](https://www.bloque.app)
