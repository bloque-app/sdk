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
> Replace `x.x.x` with the latest version from [npm](https://www.npmjs.com/package/@bloque/sdk).

## Platform Support

This SDK is compatible with multiple JavaScript runtimes:

- **Node.js** 22.x or higher
- **Bun** 1.x or higher
- **Deno** Latest version
- **Web/Browsers** Modern browsers with ES2020+ support

## Features

- **TypeScript First**: Built with TypeScript for complete type safety
- **Simple API**: Intuitive interface for managing organizations, compliance, accounts, and identity
- **Virtual Cards**: Create and manage virtual cards with real-time balance tracking
- **Identity Registration**: Register individual users (KYC) and businesses (KYB) with multi-method authentication
- **User Sessions**: Secure user session management with `connect()` for authenticated operations
- **Fully Async**: Promise-based API for modern JavaScript workflows
- **Lightweight**: Minimal dependencies for optimal bundle size
- **Modular**: Import only what you need with tree-shakeable exports

> **📌 Important:** Most operations require connecting to a user session first using `bloque.connect(urn)`. This ensures proper authentication and authorization. See the [User Sessions](#user-sessions-with-connect) section for details.

## Installation

```bash
bun add @bloque/sdk
```

## Quick Start

### Backend (Node.js, Bun, Deno)

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

// Initialize the SDK with API key (backend only)
const bloque = new SDK({
  origin: 'your-origin-name', // Required: your origin identifier
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production', // or 'sandbox' for testing
  platform: 'node', // optional: 'node' | 'bun' | 'deno'
});

// Connect to user session for account operations
async function createCard() {
  // First, connect to the user's session
  const userSession = await bloque.connect('did:bloque:your-origin:user-alias');

  // Now create a virtual card through the session
  const card = await userSession.accounts.card.create({
    urn: 'did:bloque:your-origin:user-alias',
    name: 'My Virtual Card',
  });

  console.log('Card created:', card.urn);
  console.log('Last four digits:', card.lastFour);
}

// Create an organization (direct SDK access, no connect needed)
async function createOrganization() {
  const params: CreateOrgParams = {
    org_type: 'business',
    profile: {
      legal_name: 'Acme Corporation',
      tax_id: '123456789',
      incorporation_date: '2020-01-01',
      business_type: 'llc',
      incorporation_country_code: 'US',
      incorporation_state: 'CA',
      address_line1: '123 Main St',
      postal_code: '12345',
      city: 'San Francisco',
    },
    metadata: {
      source: 'api',
    },
  };

  const userSession = await bloque.connect('did:bloque:your-origin:user-alias');
  const organization = await userSession.orgs.create(params);
  console.log('Organization created:', organization);
}
```

### Frontend (Browser, React Native)

```typescript
import { SDK } from '@bloque/sdk';

// Initialize the SDK with JWT authentication
const bloque = new SDK({
  auth: { type: 'jwt' },
  mode: 'production',
  platform: 'browser', // or 'react-native'
  // tokenStorage is optional for browser (uses localStorage by default)
  // for react-native, provide a custom storage implementation
});

// After user registration, the SDK automatically stores the JWT
const result = await bloque.identity.origins.register('ethereum-mainnet', {
  assertionResult: { /* ... */ },
  type: 'individual',
  profile: { /* ... */ }
});

// The token is now stored and used for subsequent requests
const alias = await bloque.identity.aliases.get('user@example.com');
```

## Configuration

### Initialize the SDK

The SDK supports different authentication methods depending on where it's running:

#### Backend Configuration (API Key)

For server-side applications (Node.js, Bun, Deno):

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!, // Your Bloque API key
  },
  mode: 'production', // 'sandbox' or 'production'
  platform: 'node', // optional: 'node' | 'bun' | 'deno' (defaults to 'node')
});
```

#### Frontend Configuration (JWT)

For client-side applications (Browser, React Native):

```typescript
import { SDK } from '@bloque/sdk';

// Browser
const bloque = new SDK({
  auth: { type: 'jwt' },
  mode: 'production',
  platform: 'browser',
  // tokenStorage is optional - uses localStorage by default
});

// React Native (with custom storage)
import AsyncStorage from '@react-native-async-storage/async-storage';

const bloque = new SDK({
  auth: { type: 'jwt' },
  mode: 'production',
  platform: 'react-native',
  tokenStorage: {
    get: async () => await AsyncStorage.getItem('access_token'),
    set: async (token: string) => await AsyncStorage.setItem('access_token', token),
    clear: async () => await AsyncStorage.removeItem('access_token'),
  },
});
```

### Configuration Options

- **`origin`** (string, required): Your origin identifier/namespace
  - This identifies your application or organization in the Bloque platform
  - Example: `'my-app'`, `'bloque-root'`, `'ethereum-mainnet'`

- **`auth`** (object, required): Authentication configuration
  - `type: 'apiKey'`: For backend platforms
    - `apiKey` (string, required): Your Bloque API key
  - `type: 'jwt'`: For frontend platforms
    - Requires storing and managing JWT tokens via `tokenStorage`

- **`mode`** ('sandbox' | 'production', optional): Environment mode
  - `sandbox`: For testing and development
  - `production`: For live operations (default)

- **`platform`** (string, optional): Execution platform
  - Backend: `'node'` (default) | `'bun'` | `'deno'`
  - Frontend: `'browser'` | `'react-native'`
  - Determines available authentication methods

- **`tokenStorage`** (object, optional): JWT token storage mechanism
  - Required for JWT authentication on non-browser platforms
  - Browser automatically uses `localStorage` if not provided
  - Must implement: `get()`, `set(token)`, `clear()`

### User Sessions with `connect()`

Most operations in the SDK require connecting to a user session first. This ensures proper authentication and authorization for user-specific operations.

```typescript
// Initialize SDK
const bloque = new SDK({
  origin: 'your-origin',
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Connect to user session
const userSession = await bloque.connect('did:bloque:your-origin:user-alias');

// Now perform operations through the session
const card = await userSession.accounts.card.create({
  urn: 'did:bloque:your-origin:user-alias',
  name: 'My Card',
});
```

**What `connect()` does:**
- Authenticates the user with the specified URN
- Obtains an access token for the user session
- Returns a session object with access to: `accounts`, `compliance`, `identity`, `orgs`

**URN Format:**
- Pattern: `did:bloque:{origin}:{user-alias}`
- Example: `did:bloque:my-app:john-doe`
- The `{origin}` must match the origin specified in SDK configuration
- The `{user-alias}` is the user's unique identifier in your origin

### Platform and Authentication Compatibility

| Platform | API Key Auth | JWT Auth | Token Storage |
|----------|--------------|----------|---------------|
| `node` | ✅ | ✅ | Required for JWT |
| `bun` | ✅ | ✅ | Required for JWT |
| `deno` | ✅ | ✅ | Required for JWT |
| `browser` | ❌ | ✅ | Optional (uses localStorage) |
| `react-native` | ❌ | ✅ | Required |

## API Reference

### Organizations

The organizations resource allows you to create and manage organizations in the Bloque platform.

#### Create an Organization

```typescript
// Connect to user session first
const userSession = await bloque.connect('did:bloque:your-origin:user-alias');

// Create organization through the session
const organization = await userSession.orgs.create(params);
```

**Parameters**:

```typescript
interface CreateOrgParams {
  org_type: 'business' | 'individual';  // Organization type
  profile: OrgProfile;                   // Organization profile details
  metadata?: Record<string, unknown>;    // Optional custom metadata
}

interface OrgProfile {
  legal_name: string;                    // Legal name of the organization
  tax_id: string;                        // Tax ID number
  incorporation_date: string;            // Date of incorporation (YYYY-MM-DD)
  business_type: string;                 // Type of business (e.g., 'llc', 'corporation')
  incorporation_country_code: string;    // Country code (ISO 3166-1 alpha-2)
  incorporation_state?: string;          // State/province (optional)
  address_line1: string;                 // Primary address line
  address_line2?: string;                // Secondary address line (optional)
  postal_code: string;                   // Postal/ZIP code
  city: string;                          // City
  logo_url?: string;                     // Logo URL (optional)
  places?: Place[];                      // Additional places/locations (optional)
}

interface Place {
  country_code: string;                  // Country code
  state: string;                         // State/province
  address_line1: string;                 // Address line 1
  postal_code: string;                   // Postal code
  city: string;                          // City
  is_primary: boolean;                   // Whether this is the primary place
}
```

**Response**:

```typescript
interface Organization {
  urn: string;                           // Unique resource name
  org_type: 'business' | 'individual';   // Organization type
  profile: OrgProfile;                   // Organization profile
  metadata?: Record<string, unknown>;    // Custom metadata
  status: OrgStatus;                     // Organization status
}

type OrgStatus =
  | 'awaiting_compliance_verification'
  | 'active'
  | 'suspended'
  | 'closed';
```

### Compliance

The compliance resource provides KYC (Know Your Customer) verification functionality.

#### Start KYC Verification

Start a KYC verification process for a user:

```typescript
// Connect to user session
const userSession = await bloque.connect('did:bloque:your-origin:user-alias');

// Start KYC verification
const verification = await userSession.compliance.kyc.startVerification({
  urn: 'did:bloque:your-origin:user-alias',
});
```

**Parameters**:

```typescript
interface KycVerificationParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the user
   * within the system. This value is used to associate the KYC
   * verification process with a specific user.
   *
   * @example "did:bloque:origin:..."
   */
  urn: string;

  /**
   * URL where webhook notifications will be sent when the verification
   * status changes (optional).
   *
   * @example "https://api.example.com/webhooks/kyc"
   */
  webhookUrl?: string;
}
```

**Response**:

```typescript
interface KycVerificationResponse {
  url: string;  // URL where the user should complete the verification
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
}
```

#### Get KYC Verification Status

Get the current status of a KYC verification:

```typescript
const status = await bloque.compliance.kyc.getVerification({
  urn: 'did:bloque:user:123e4567',
});
```

**Parameters**:

```typescript
interface GetKycVerificationParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the user
   * within the system.
   *
   * @example "did:bloque:user:123e4567"
   */
  urn: string;
}
```

**Response**:

```typescript
interface KycVerificationStatus {
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
  url: string;                                  // URL for verification
  completedAt: string | null;                               // Completion date (ISO 8601)
}
```

### Accounts

The accounts resource allows you to create virtual cards for users.

#### Create a Virtual Card

Create a virtual card for a user:

```typescript
// Connect to user session
const userSession = await bloque.connect('did:bloque:your-origin:user-alias');

// Create virtual card
const card = await userSession.accounts.card.create({
  urn: 'did:bloque:your-origin:user-alias',
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

**Response**:

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
  balance?: Record<string, TokenBalance>; // Token balances (only in list responses)
}

interface TokenBalance {
  current: string;  // Current balance
  pending: string;  // Pending balance
  in: string;       // Total incoming
  out: string;      // Total outgoing
}
```

#### List Card Accounts

List all card accounts for a holder with their current balances:

```typescript
// Using connected user session (recommended)
const userSession = await bloque.connect('did:bloque:your-origin:user-alias');
const cards = await userSession.accounts.card.list();

// Or with explicit holder URN
const cards = await bloque.accounts.card.list({
  holderUrn: 'did:bloque:bloque-whatsapp:573023348486',
});
```

**Parameters**:

```typescript
interface ListCardParams {
  /**
   * URN of the account holder to filter by
   * Optional when using a connected session - defaults to session URN
   * @example "did:bloque:bloque-whatsapp:573023348486"
   */
  holderUrn?: string;
}
```

**Response**: `Promise<CardAccount[]>` - Array of card accounts with balances

Each card in the response includes all standard fields plus a `balance` object containing token balances with current, pending, in, and out amounts for each token.

### Identity

The identity resource allows you to register identities, retrieve user aliases, and manage authentication origins.

#### Register Identity

Register a new user or business identity to an authentication origin. Supports individual users (KYC) and businesses (KYB):

```typescript
// Register individual user
const individual = await bloque.identity.origins.register('ethereum-mainnet', {
  assertionResult: {
    alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    challengeType: 'SIGNING_CHALLENGE',
    value: {
      signature: '0x1234567890abcdef...',
      alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    }
  },
  type: 'individual',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
});

// Register business
const business = await bloque.identity.origins.register('bloque-api', {
  assertionResult: {
    alias: 'business-123',
    challengeType: 'API_KEY',
    value: {
      apiKey: 'sk_live_abc123',
      alias: 'business-123'
    }
  },
  type: 'business',
  profile: {
    legalName: 'Acme Corporation',
    name: 'Acme Corp',
    taxId: '12-3456789',
    type: 'LLC',
    incorporationDate: '2020-01-15',
    addressLine1: '123 Business St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States'
  }
});
```

**Parameters**:

```typescript
// Registration parameters (discriminated union by type)
type RegisterParams = IndividualRegisterParams | BusinessRegisterParams;

interface IndividualRegisterParams {
  assertionResult: AssertionResult;
  extraContext?: Record<string, unknown>;
  type: 'individual';
  profile: UserProfile;
}

interface BusinessRegisterParams {
  assertionResult: AssertionResult;
  extraContext?: Record<string, unknown>;
  type: 'business';
  profile: BusinessProfile;
}

// Assertion result for challenge verification
interface AssertionResult {
  alias: string;                                  // Identity identifier
  challengeType: 'SIGNING_CHALLENGE' | 'API_KEY' | 'OAUTH_REDIRECT' | 'WEBAUTHN' | 'OTP' | 'PASSWORD';
  value: {
    signature?: string;                           // For SIGNING_CHALLENGE
    apiKey?: string;                              // For API_KEY
    alias: string;
  };
  originalChallengeParams?: {
    challenge: string;
    timestamp: number;
  };
}

// Individual user profile (KYC)
interface UserProfile {
  firstName?: string;
  lastName?: string;
  birthdate?: string;                             // ISO 8601 (YYYY-MM-DD)
  email?: string;
  phone?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  neighborhood?: string;
  countryOfBirthCode?: string;
  countryOfResidenceCode?: string;
  personalIdType?: string;
  personalIdNumber?: string;
}

// Business profile (KYB)
interface BusinessProfile {
  // Required fields
  addressLine1: string;
  city: string;
  country: string;
  incorporationDate: string;
  legalName: string;
  name: string;
  postalCode: string;
  state: string;
  taxId: string;
  type: string;

  // Optional fields
  addressLine2?: string;
  countryCode?: string;
  email?: string;
  logo?: string;
  phone?: string;

  // Beneficial owner information
  ownerName?: string;
  ownerIdType?: string;
  ownerIdNumber?: string;
  ownerAddressLine1?: string;
  ownerCity?: string;
  ownerState?: string;
  ownerPostalCode?: string;
  ownerCountryCode?: string;
}
```

**Response**:

```typescript
interface RegisterResult {
  accessToken: string;  // JWT access token for authenticated sessions
}
```

#### Get Alias

Retrieve alias information by the alias value:

```typescript
const alias = await bloque.identity.aliases.get('user@example.com');
```

**Parameters**:

```typescript
// Pass the alias string directly
const alias: string = 'user@example.com' | '+1234567890';
```

**Response**:

```typescript
interface Alias {
  id: string;                                  // Unique alias ID
  alias: string;                               // Alias value
  type: 'phone' | 'email' | string;           // Alias type
  urn: string;                                 // Associated user URN
  origin: string;                              // Origin identifier
  details: {
    phone?: string;                            // Phone details (if applicable)
  };
  metadata: {
    alias: string;                             // Alias in metadata
    [key: string]: unknown;                    // Additional metadata
  };
  status: 'active' | 'inactive' | 'revoked';  // Alias status
  is_public: boolean;                          // Whether alias is public
  is_primary: boolean;                         // Whether this is the primary alias
  created_at: string;                          // Creation timestamp (ISO 8601)
  updated_at: string;                          // Last update timestamp (ISO 8601)
}
```

## Examples

### Creating a Business Organization

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

// Initialize SDK with your API key
const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Create a business organization
const params: CreateOrgParams = {
  org_type: 'business',
  profile: {
    legal_name: 'Acme Corporation',
    tax_id: '12-3456789',
    incorporation_date: '2020-01-15',
    business_type: 'llc',
    incorporation_country_code: 'US',
    incorporation_state: 'CA',
    address_line1: '123 Market Street',
    address_line2: 'Suite 400',
    postal_code: '94103',
    city: 'San Francisco',
    logo_url: 'https://example.com/logo.png',
  },
  metadata: {
    source: 'web_app',
    campaign: 'q1_2024',
  },
};

try {
  const organization = await bloque.orgs.create(params);
  console.log('Organization created:', organization.urn);
  console.log('Status:', organization.status);
} catch (error) {
  console.error('Failed to create organization:', error);
}
```

### Creating an Individual Organization

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'sandbox',
});

const params: CreateOrgParams = {
  org_type: 'individual',
  profile: {
    legal_name: 'John Doe',
    tax_id: '123-45-6789',
    incorporation_date: '1990-05-20',
    business_type: 'sole_proprietorship',
    incorporation_country_code: 'US',
    address_line1: '456 Oak Avenue',
    postal_code: '10001',
    city: 'New York',
  },
};

const organization = await bloque.orgs.create(params);
console.log('Individual organization created:', organization);
```

### Organization with Multiple Locations

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

const params: CreateOrgParams = {
  org_type: 'business',
  profile: {
    legal_name: 'Global Tech Solutions Inc.',
    tax_id: '98-7654321',
    incorporation_date: '2018-03-10',
    business_type: 'corporation',
    incorporation_country_code: 'US',
    incorporation_state: 'DE',
    address_line1: '789 Corporate Blvd',
    postal_code: '19801',
    city: 'Wilmington',
    places: [
      {
        country_code: 'US',
        state: 'CA',
        address_line1: '100 Silicon Valley Drive',
        postal_code: '94025',
        city: 'Menlo Park',
        is_primary: true,
      },
      {
        country_code: 'US',
        state: 'NY',
        address_line1: '250 Broadway',
        postal_code: '10007',
        city: 'New York',
        is_primary: false,
      },
    ],
  },
};

const organization = await bloque.orgs.create(params);
console.log('Multi-location organization created');
```

### Starting KYC Verification

```typescript
import { SDK } from '@bloque/sdk';
import type { KycVerificationParams } from '@bloque/sdk/compliance';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Start KYC verification for a user
const params: KycVerificationParams = {
  urn: 'did:bloque:origin:user-123',
  webhookUrl: 'https://api.example.com/webhooks/kyc', // Optional webhook URL
};

try {
  const verification = await bloque.compliance.kyc.startVerification(params);

  console.log('Verification URL:', verification.url);
  console.log('Status:', verification.status);

  // Redirect the user to verification.url to complete KYC
  // Webhook notifications will be sent to the provided webhookUrl
} catch (error) {
  console.error('Failed to start KYC verification:', error);
}
```

### Getting KYC Verification Status

```typescript
import { SDK } from '@bloque/sdk';
import type { GetKycVerificationParams } from '@bloque/sdk/compliance';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Get verification status
const params: GetKycVerificationParams = {
  urn: 'did:bloque:user:123e4567',
};

try {
  const status = await bloque.compliance.kyc.getVerification(params);

  console.log('Status:', status.status);
  console.log('Verification URL:', status.url);
  console.log('Completed At:', status.completedAt);

  if (status.status === 'approved') {
    console.log('User verification approved!');
  } else if (status.status === 'rejected') {
    console.log('User verification rejected');
  } else {
    console.log('Verification still pending');
  }
} catch (error) {
  console.error('Failed to get verification status:', error);
}
```

### Creating a Virtual Card

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateCardParams } from '@bloque/sdk/accounts';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Create a virtual card
const params: CreateCardParams = {
  urn: 'did:bloque:user:123e4567',
  name: 'My Business Card', // Optional
};

try {
  const card = await bloque.accounts.card.create(params);

  console.log('Card created:', card.urn);
  console.log('Last four digits:', card.lastFour);
  console.log('Card type:', card.cardType);
  console.log('Status:', card.status);
  console.log('Details URL:', card.detailsUrl);

  // Check if card is ready to use
  if (card.status === 'active') {
    console.log('Card is active and ready to use!');
  } else if (card.status === 'creation_in_progress') {
    console.log('Card is being created...');
  }
} catch (error) {
  console.error('Failed to create card:', error);
}
```

### Listing Card Accounts

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  origin: 'your-origin',
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Connect to user session
const userSession = await bloque.connect('did:bloque:bloque-whatsapp:573023348486');

// List all cards for the connected user
try {
  const cards = await userSession.accounts.card.list();

  console.log(`Found ${cards.length} card accounts`);

  cards.forEach((card) => {
    console.log('\n---');
    console.log('Card URN:', card.urn);
    console.log('Last Four:', card.lastFour);
    console.log('Status:', card.status);
    console.log('Card Name:', card.metadata?.name);

    // Display balances
    if (card.balance) {
      console.log('Balances:');
      Object.entries(card.balance).forEach(([token, balance]) => {
        console.log(`  ${token}:`);
        console.log(`    Current: ${balance.current}`);
        console.log(`    Pending: ${balance.pending}`);
        console.log(`    In: ${balance.in}`);
        console.log(`    Out: ${balance.out}`);
      });
    }
  });

  // Find active cards only
  const activeCards = cards.filter(card => card.status === 'active');
  console.log(`\n${activeCards.length} cards are active`);

  // Calculate total balance across all cards
  const totalBalances: Record<string, bigint> = {};

  activeCards.forEach(card => {
    if (card.balance) {
      Object.entries(card.balance).forEach(([token, balance]) => {
        if (!totalBalances[token]) {
          totalBalances[token] = BigInt(0);
        }
        totalBalances[token] += BigInt(balance.current);
      });
    }
  });

  console.log('\nTotal balances across all active cards:');
  Object.entries(totalBalances).forEach(([token, total]) => {
    console.log(`  ${token}: ${total.toString()}`);
  });
} catch (error) {
  console.error('Failed to list cards:', error);
}
```

### Retrieving User Alias Information

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Get alias information by email
try {
  const alias = await bloque.identity.aliases.get('user@example.com');

  console.log('Alias ID:', alias.id);
  console.log('Alias type:', alias.type);
  console.log('Associated URN:', alias.urn);
  console.log('Status:', alias.status);
  console.log('Is primary:', alias.is_primary);
  console.log('Is public:', alias.is_public);

  if (alias.status === 'active') {
    console.log('Alias is active');
  }
} catch (error) {
  console.error('Failed to retrieve alias:', error);
}

// Get alias information by phone number
try {
  const phoneAlias = await bloque.identity.aliases.get('+1234567890');

  console.log('Phone alias:', phoneAlias.alias);
  console.log('Phone details:', phoneAlias.details.phone);
} catch (error) {
  console.error('Failed to retrieve phone alias:', error);
}
```

### Registering Individual User Identity (KYC)

```typescript
import { SDK } from '@bloque/sdk';
import type { IndividualRegisterParams } from '@bloque/sdk/identity';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Register an individual with blockchain signature
const params: IndividualRegisterParams = {
  assertionResult: {
    alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    challengeType: 'SIGNING_CHALLENGE',
    value: {
      signature: '0x1234567890abcdef...',
      alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    },
    originalChallengeParams: {
      challenge: 'bloque-challenge-1234567890',
      timestamp: 1640995200
    }
  },
  type: 'individual',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    birthdate: '1990-01-15',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    addressLine1: '123 Main St',
    countryOfBirthCode: 'USA',
    countryOfResidenceCode: 'USA',
    personalIdType: 'SSN',
    personalIdNumber: '123-45-6789'
  }
};

try {
  const result = await bloque.identity.origins.register('ethereum-mainnet', params);

  console.log('User registered successfully!');
  console.log('Access token:', result.accessToken);

  // Store the access token securely for the user's session
  // Use it for subsequent authenticated API calls
} catch (error) {
  console.error('Registration failed:', error);
}
```

### Registering Business Identity (KYB)

```typescript
import { SDK } from '@bloque/sdk';
import type { BusinessRegisterParams } from '@bloque/sdk/identity';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Register a business with API key authentication
const params: BusinessRegisterParams = {
  assertionResult: {
    alias: 'business-123',
    challengeType: 'API_KEY',
    value: {
      apiKey: 'sk_live_abc123def456',
      alias: 'business-123'
    }
  },
  type: 'business',
  profile: {
    // Required business information
    legalName: 'Acme Corporation',
    name: 'Acme Corp',
    taxId: '12-3456789',
    type: 'LLC',
    incorporationDate: '2020-01-15',
    addressLine1: '123 Business St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States',

    // Optional business information
    addressLine2: 'Suite 100',
    countryCode: 'US',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    logo: 'https://acme.com/logo.png',

    // Beneficial owner information (for compliance)
    ownerName: 'Jane Smith',
    ownerIdType: 'SSN',
    ownerIdNumber: '123-45-6789',
    ownerAddressLine1: '456 Owner Ave',
    ownerCity: 'New York',
    ownerState: 'NY',
    ownerPostalCode: '10002',
    ownerCountryCode: 'US'
  }
};

try {
  const result = await bloque.identity.origins.register('bloque-api', params);

  console.log('Business registered successfully!');
  console.log('Access token:', result.accessToken);

  // Use the access token for authenticated API calls
} catch (error) {
  console.error('Business registration failed:', error);
}
```

### Using in an API Endpoint

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});

app.post('/api/organizations', async (req, res) => {
  try {
    const params: CreateOrgParams = req.body;

    const organization = await bloque.orgs.create(params);

    res.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('Organization creation failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```


## Error Handling

The SDK uses standard JavaScript errors. Always wrap API calls in try-catch blocks:

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

try {
  const organization = await bloque.orgs.create({
    org_type: 'business',
    profile: {
      legal_name: 'Acme Corp',
      tax_id: '123456789',
      incorporation_date: '2020-01-01',
      business_type: 'llc',
      incorporation_country_code: 'US',
      address_line1: '123 Main St',
      postal_code: '12345',
      city: 'San Francisco',
    },
  });
  console.log('Success:', organization);
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to create organization:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## TypeScript Support

This SDK is written in TypeScript and includes complete type definitions. You'll get full autocomplete and type checking when using TypeScript or modern editors like VS Code:

```typescript
import { SDK } from '@bloque/sdk';
import type {
  BloqueConfig,
  CreateOrgParams,
  Organization,
  OrgProfile,
  OrgStatus,
  OrgType,
  Place,
} from '@bloque/sdk/orgs';

// Type-safe configuration
const config: BloqueConfig = {
  apiKey: 'your-api-key',
  mode: 'sandbox',
};

const bloque = new SDK(config);

// Type-safe organization profile
const profile: OrgProfile = {
  legal_name: 'Tech Startup Inc.',
  tax_id: '12-3456789',
  incorporation_date: '2023-01-15',
  business_type: 'llc',
  incorporation_country_code: 'US',
  incorporation_state: 'CA',
  address_line1: '456 Innovation Dr',
  postal_code: '94025',
  city: 'Menlo Park',
};

// Type-safe organization creation
const params: CreateOrgParams = {
  org_type: 'business',
  profile,
  metadata: {
    vertical: 'fintech',
    employees: 50,
  },
};

// TypeScript infers the return type as Organization
const org = await bloque.orgs.create(params);
```

**Available Types**:

The SDK exports all necessary types for type-safe development:

```typescript
// Main SDK types
import type { SDK, BloqueConfig } from '@bloque/sdk';

// Organization types
import type {
  Organization,
  CreateOrgParams,
  CreateOrgResponse,
  OrgProfile,
  OrgType,
  OrgStatus,
  Place,
} from '@bloque/sdk/orgs';

// Compliance types
import type {
  KycVerificationParams,
  KycVerificationResponse,
  GetKycVerificationParams,
  KycVerificationStatus,
} from '@bloque/sdk/compliance';

// Accounts types
import type {
  CardAccount,
  CreateCardParams,
  ListCardParams,
  TokenBalance,
} from '@bloque/sdk/accounts';

// Identity types
import type {
  Alias,
  RegisterParams,
  IndividualRegisterParams,
  BusinessRegisterParams,
  RegisterResult,
  UserProfile,
  BusinessProfile,
  AssertionResult,
} from '@bloque/sdk/identity';
```

## Development

### Building the SDK

```bash
bun install
bun run build
```

### Development Mode (Watch)

```bash
bun run dev
```

### Type Checking

```bash
bun run typecheck
```

### Code Quality

```bash
bun run check
```

## Requirements

- One of the supported runtimes: Node.js 22.x+, Bun 1.x+, Deno, or modern browsers
- TypeScript 5.x or higher (for TypeScript projects, optional)

## Links

- [Homepage](https://www.bloque.app)
- [GitHub Repository](https://github.com/bloque-app/sdk)
- [Issue Tracker](https://github.com/bloque-app/sdk/issues)

## Package Structure

This monorepo contains the following packages:

- **`@bloque/sdk`**: Main SDK package
- **`@bloque/sdk-core`**: Core utilities and HTTP client
- **`@bloque/sdk-orgs`**: Organizations API client
- **`@bloque/sdk-compliance`**: Compliance and KYC verification API client
- **`@bloque/sdk-accounts`**: Accounts and virtual cards API client
- **`@bloque/sdk-identity`**: Identity and aliases API client

## License

[MIT](../../LICENSE)

