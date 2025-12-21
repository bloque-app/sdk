# Bloque SDK

The official TypeScript/JavaScript SDK for integrating [Bloque](https://www.bloque.app) into your applications.

## Features

- **TypeScript First**: Built with TypeScript for complete type safety
- **Simple API**: Intuitive interface for managing organizations, compliance, and accounts
- **Fully Async**: Promise-based API for modern JavaScript workflows
- **Lightweight**: Minimal dependencies for optimal bundle size
- **Modular**: Import only what you need with tree-shakeable exports

## Installation

```bash
bun add @bloque/sdk
```

## Quick Start

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

// Initialize the SDK (server-side only)
const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production', // or 'sandbox' for testing
});

// Create an organization
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

  const organization = await bloque.orgs.create(params);
  console.log('Organization created:', organization);
}

// Create a virtual card
async function createCard() {
  const card = await bloque.accounts.card.create({
    urn: 'did:bloque:user:123e4567',
    name: 'My Virtual Card',
  });

  console.log('Card created:', card.urn);
  console.log('Last four digits:', card.lastFour);
}
```

## Configuration

### Initialize the SDK

```typescript
import { SDK } from '@bloque/sdk';
import type { BloqueConfig } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: 'your-api-key-here',    // Required: Your Bloque API key
  mode: 'sandbox',                 // Required: 'sandbox' or 'production'
});
```

### Configuration Options

- **`apiKey`** (string, required): Your Bloque API key
- **`mode`** ('sandbox' | 'production', required): Environment mode
  - `sandbox`: For testing and development
  - `production`: For live operations

## API Reference

### Organizations

The organizations resource allows you to create and manage organizations in the Bloque platform.

#### Create an Organization

```typescript
const organization = await bloque.orgs.create(params);
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
const verification = await bloque.compliance.kyc.startVerification({
  urn: 'did:bloque:origin:user-id',
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
const card = await bloque.accounts.card.create({
  urn: 'did:bloque:user:123e4567',
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
}
```

## Examples

### Creating a Business Organization

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

// Initialize SDK with your API key
const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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

### Using in an API Endpoint

```typescript
import { SDK } from '@bloque/sdk';
import type { CreateOrgParams } from '@bloque/sdk/orgs';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
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
} from '@bloque/sdk/accounts';
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

- Node.js 22.x or higher / Bun 1.x or higher
- TypeScript 5.x or higher (for TypeScript projects)

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

## License

[MIT](../../LICENSE)

