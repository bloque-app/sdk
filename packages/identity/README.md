# @bloque/sdk-identity

Identity, aliases, and OTP authentication API client for the Bloque SDK.

## Features

- **Identity Registration**: Register individual users (KYC) and businesses (KYB) to authentication origins
- **Multi-Origin Support**: Register identities across blockchain, OAuth, API key, and custom origins
- **Origin Management**: List and discover all available authentication origins
- **Aliases**: Get user identity information by email or phone
- **OTP Origins**: Send OTP codes via WhatsApp or Email
- **Custom Origins**: Support for custom authentication origins
- **Multiple Authentication Methods**: SIGNING_CHALLENGE, API_KEY, OAUTH_REDIRECT, WEBAUTHN, OTP, PASSWORD
- **TypeScript First**: Built with TypeScript for complete type safety

## Installation

```bash
bun add @bloque/sdk-identity
```

## Usage

This package is typically used through the main `@bloque/sdk` package, but can be used standalone:

```typescript
import { HttpClient } from '@bloque/sdk-core';
import { IdentityClient } from '@bloque/sdk-identity';

const httpClient = new HttpClient({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

const identity = new IdentityClient(httpClient);

// Get alias information
const alias = await identity.aliases.get('user@example.com');
console.log('User URN:', alias.urn);
console.log('Alias status:', alias.status);

// Send OTP via WhatsApp
const otpWhatsApp = await identity.origins.whatsapp.assert('+1234567890');
console.log('OTP sent to:', otpWhatsApp.value.phone);
console.log('Expires at:', otpWhatsApp.value.expires_at);

// Send OTP via Email
const otpEmail = await identity.origins.email.assert('user@example.com');
console.log('OTP sent to:', otpEmail.value.email);
console.log('Attempts remaining:', otpEmail.params.attempts_remaining);
```

## API Reference

### Aliases

#### `aliases.get(alias)`

Retrieve alias information by the alias value (email or phone):

```typescript
const alias = await identity.aliases.get('user@example.com');
```

**Parameters**:
- `alias` (string): Email address or phone number

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

### Origins

Origins provide OTP (One-Time Password) authentication flows for different channels.

#### `origins.whatsapp.assert(phone)`

Send an OTP code via WhatsApp to the specified phone number:

```typescript
const otp = await identity.origins.whatsapp.assert('+1234567890');
```

**Parameters**:
- `phone` (string): Phone number in international format (e.g., '+1234567890')

**Response**:

```typescript
interface OTPAssertionWhatsApp {
  type: 'OTP';
  params: {
    attempts_remaining: number;  // Number of remaining OTP attempts
  };
  value: {
    phone: string;              // Phone number where OTP was sent
    expires_at: number;         // Unix timestamp when OTP expires
  };
}
```

#### `origins.email.assert(email)`

Send an OTP code via Email to the specified email address:

```typescript
const otp = await identity.origins.email.assert('user@example.com');
```

**Parameters**:
- `email` (string): Email address

**Response**:

```typescript
interface OTPAssertionEmail {
  type: 'OTP';
  params: {
    attempts_remaining: number;  // Number of remaining OTP attempts
  };
  value: {
    email: string;              // Email address where OTP was sent
    expires_at: number;         // Unix timestamp when OTP expires
  };
}
```

#### `origins.custom(origin)`

Create a custom origin client for custom authentication origins:

```typescript
const customOrigin = identity.origins.custom('my-custom-origin');
const otp = await customOrigin.assert('identifier');
```

**Parameters**:
- `origin` (string): Custom origin identifier

**Returns**: `OriginClient<OTPAssertion>` instance with `assert()` method

#### `origins.list()`

List all available origins with their current status:

```typescript
const origins = await identity.origins.list();
```

**Response**:

```typescript
interface Origin {
  namespace: string;                         // Unique namespace identifier
  provider: string;                          // Provider type (e.g., 'evm', 'auth0', 'whatsapp')
  status: 'active' | 'inactive' | 'disabled'; // Current status
  metadata: Record<string, unknown>;         // Additional metadata
  created_at: string;                        // Creation timestamp (ISO 8601)
  updated_at: string;                        // Last update timestamp (ISO 8601)
}
```

**Returns**: `Promise<Origin[]>` - Array of all registered origins

#### `origins.register(origin, params)`

Register a new user or business identity to a specific origin. Supports both individual users (KYC) and businesses (KYB) with various authentication methods:

```typescript
// Register individual with blockchain signature
const individual = await identity.origins.register('ethereum-mainnet', {
  assertionResult: {
    alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    challengeType: 'SIGNING_CHALLENGE',
    value: {
      signature: '0x1234...',
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

// Register business with API key
const business = await identity.origins.register('bloque-api', {
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
- `origin` (string): Origin namespace to register to (e.g., 'ethereum-mainnet', 'bloque-api')
- `params` (RegisterParams): Registration parameters

**Assertion Challenge Types**:
- `SIGNING_CHALLENGE`: Blockchain signature verification
- `API_KEY`: Traditional API key authentication
- `OAUTH_REDIRECT`: OAuth-based flows
- `WEBAUTHN`: WebAuthn/passkey authentication
- `OTP`: One-time password verification
- `PASSWORD`: Password-based authentication

**Individual Profile (KYC)**:
```typescript
interface UserProfile {
  firstName?: string;
  lastName?: string;
  birthdate?: string;           // ISO 8601 (YYYY-MM-DD)
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
```

**Business Profile (KYB)**:
```typescript
interface BusinessProfile {
  // Required fields
  addressLine1: string;
  city: string;
  country: string;
  incorporationDate: string;    // YYYY-MM-DD
  legalName: string;
  name: string;
  postalCode: string;
  state: string;
  taxId: string;
  type: string;                 // LLC, Corporation, etc.

  // Optional fields
  addressLine2?: string;
  countryCode?: string;
  email?: string;
  logo?: string;
  phone?: string;

  // Owner information
  ownerName?: string;
  ownerIdType?: string;
  ownerIdNumber?: string;
  ownerAddressLine1?: string;
  ownerAddressLine2?: string;
  ownerCity?: string;
  ownerState?: string;
  ownerPostalCode?: string;
  ownerCountryCode?: string;
}
```

**Response**:
```typescript
interface RegisterResult {
  accessToken: string;  // JWT token for authenticated sessions
}
```

**Returns**: `Promise<RegisterResult>` - Registration result with access token

## Examples

### Get Email Alias

```typescript
try {
  const alias = await identity.aliases.get('user@example.com');

  if (alias.status === 'active') {
    console.log('Active user:', alias.urn);
  }
} catch (error) {
  console.error('Failed to get alias:', error);
}
```

### Get Phone Alias

```typescript
try {
  const phoneAlias = await identity.aliases.get('+1234567890');

  console.log('Phone details:', phoneAlias.details.phone);
  console.log('User URN:', phoneAlias.urn);
} catch (error) {
  console.error('Failed to get phone alias:', error);
}
```

### Send OTP via WhatsApp

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

try {
  const otp = await bloque.identity.origins.whatsapp.assert('+1234567890');

  console.log('OTP sent to:', otp.value.phone);
  console.log('Expires at:', new Date(otp.value.expires_at * 1000));
  console.log('Attempts remaining:', otp.params.attempts_remaining);

  // Now user can verify the OTP code they received
} catch (error) {
  console.error('Failed to send OTP:', error);
}
```

### Send OTP via Email

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

try {
  const otp = await bloque.identity.origins.email.assert('user@example.com');

  console.log('OTP sent to:', otp.value.email);
  console.log('Expires at:', new Date(otp.value.expires_at * 1000));
  console.log('Attempts remaining:', otp.params.attempts_remaining);

  // Now user can verify the OTP code they received
} catch (error) {
  console.error('Failed to send OTP:', error);
}
```

### Complete OTP Flow Example

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

async function authenticateUser(email: string) {
  try {
    // Step 1: Check if user exists
    const alias = await bloque.identity.aliases.get(email);

    if (alias.status !== 'active') {
      throw new Error('User is not active');
    }

    // Step 2: Send OTP
    const otp = await bloque.identity.origins.email.assert(email);

    console.log('OTP sent successfully to:', otp.value.email);
    console.log('User has', otp.params.attempts_remaining, 'attempts remaining');
    console.log('OTP expires at:', new Date(otp.value.expires_at * 1000));

    // Step 3: User would now verify the OTP code
    // (verification would be done through your app's verification endpoint)

    return {
      userUrn: alias.urn,
      otpSent: true,
      expiresAt: otp.value.expires_at,
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

// Usage
await authenticateUser('user@example.com');
```

### List Available Origins

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

try {
  const origins = await bloque.identity.origins.list();

  // Filter active origins
  const activeOrigins = origins.filter(o => o.status === 'active');
  console.log(`Found ${activeOrigins.length} active origins`);

  // Find specific origins
  const whatsappOrigins = origins.filter(o => o.provider === 'whatsapp');
  const evmOrigins = origins.filter(o => o.provider === 'evm');

  console.log('WhatsApp origins:', whatsappOrigins.map(o => o.namespace));
  console.log('EVM origins:', evmOrigins.map(o => o.namespace));

  // Get metadata from specific origin
  const auth0Origin = origins.find(o => o.namespace === 'bloque-auth0');
  if (auth0Origin) {
    console.log('Auth0 metadata:', auth0Origin.metadata);
  }
} catch (error) {
  console.error('Failed to list origins:', error);
}
```

### Using Custom Origin

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Create a custom origin client
const customOrigin = bloque.identity.origins.custom('my-custom-sms-provider');

try {
  const otp = await customOrigin.assert('+1234567890');

  console.log('OTP sent via custom origin');
  console.log('Attempts remaining:', otp.params.attempts_remaining);
} catch (error) {
  console.error('Failed to send OTP via custom origin:', error);
}
```

### Error Handling with Rate Limiting

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

async function sendOTPWithRetry(phone: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const otp = await bloque.identity.origins.whatsapp.assert(phone);

      if (otp.params.attempts_remaining === 0) {
        console.warn('No OTP attempts remaining!');
        return null;
      }

      console.log('OTP sent successfully');
      console.log('Attempts remaining:', otp.params.attempts_remaining);

      return otp;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw new Error('Max retries reached');
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

await sendOTPWithRetry('+1234567890');
```

### Register Individual User (KYC)

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

try {
  // Register individual with blockchain signature
  const result = await bloque.identity.origins.register('ethereum-mainnet', {
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
  });

  console.log('User registered successfully!');
  console.log('Access token:', result.accessToken);

  // Use the access token for authenticated API calls
  // Store it securely for the user's session
} catch (error) {
  console.error('Registration failed:', error);
}
```

### Register Business (KYB)

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

try {
  // Register business with API key authentication
  const result = await bloque.identity.origins.register('bloque-api', {
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

      // Beneficial owner information
      ownerName: 'Jane Smith',
      ownerIdType: 'SSN',
      ownerIdNumber: '123-45-6789',
      ownerAddressLine1: '456 Owner Ave',
      ownerCity: 'New York',
      ownerState: 'NY',
      ownerPostalCode: '10002',
      ownerCountryCode: 'US'
    }
  });

  console.log('Business registered successfully!');
  console.log('Access token:', result.accessToken);

  // Use the access token for authenticated API calls
} catch (error) {
  console.error('Business registration failed:', error);
}
```

### Multi-Origin Registration Flow

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

async function registerUserAcrossOrigins(userProfile: any) {
  try {
    // Step 1: List available origins
    const origins = await bloque.identity.origins.list();
    const activeOrigins = origins.filter(o => o.status === 'active');

    console.log(`Found ${activeOrigins.length} active origins`);

    // Step 2: Register on blockchain origin
    const ethereumOrigin = activeOrigins.find(o => o.namespace === 'ethereum-mainnet');

    if (ethereumOrigin) {
      const ethereumResult = await bloque.identity.origins.register('ethereum-mainnet', {
        assertionResult: {
          alias: userProfile.walletAddress,
          challengeType: 'SIGNING_CHALLENGE',
          value: {
            signature: userProfile.signature,
            alias: userProfile.walletAddress
          }
        },
        type: 'individual',
        profile: userProfile.personalInfo
      });

      console.log('Registered on Ethereum:', ethereumResult.accessToken);
    }

    // Step 3: Register on custom origin
    const customResult = await bloque.identity.origins.register('bloque-custom', {
      assertionResult: {
        alias: userProfile.customId,
        challengeType: 'API_KEY',
        value: {
          apiKey: userProfile.apiKey,
          alias: userProfile.customId
        }
      },
      type: 'individual',
      profile: userProfile.personalInfo
    });

    console.log('Registered on custom origin:', customResult.accessToken);

    return {
      ethereum: ethereumOrigin ? true : false,
      custom: true,
      tokens: {
        ethereum: ethereumOrigin ? 'stored' : null,
        custom: 'stored'
      }
    };
  } catch (error) {
    console.error('Multi-origin registration failed:', error);
    throw error;
  }
}

// Usage
await registerUserAcrossOrigins({
  walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  signature: '0xabcdef...',
  customId: 'user-123',
  apiKey: 'sk_live_abc123',
  personalInfo: {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com'
  }
});
```

## TypeScript Support

This package is written in TypeScript and includes complete type definitions:

```typescript
import type {
  Alias,
  Origin,
  OTPAssertionEmail,
  OTPAssertionWhatsApp,
  OTPAssertion,
  IdentityClient,
  AliasesClient,
  OriginsClient,
  OriginClient,
  // Registration types
  RegisterParams,
  IndividualRegisterParams,
  BusinessRegisterParams,
  RegisterResult,
  UserProfile,
  BusinessProfile,
} from '@bloque/sdk-identity';

// Type-safe alias retrieval
const alias: Alias = await identity.aliases.get('user@example.com');

// Type-safe origins list
const origins: Origin[] = await identity.origins.list();

// Type-safe OTP with WhatsApp
const whatsappOTP: OTPAssertionWhatsApp =
  await identity.origins.whatsapp.assert('+1234567890');

// Type-safe OTP with Email
const emailOTP: OTPAssertionEmail =
  await identity.origins.email.assert('user@example.com');

// Generic OTP type
const otp: OTPAssertion =
  await identity.origins.email.assert('user@example.com');

// Custom origin client
const customOrigin: OriginClient<OTPAssertion> =
  identity.origins.custom('my-origin');

// Type-safe individual registration
const individualParams: IndividualRegisterParams = {
  assertionResult: {
    alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    challengeType: 'SIGNING_CHALLENGE',
    value: {
      signature: '0x123...',
      alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    }
  },
  type: 'individual',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
};

const individualResult: RegisterResult =
  await identity.origins.register('ethereum-mainnet', individualParams);

// Type-safe business registration
const businessParams: BusinessRegisterParams = {
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
    legalName: 'Acme Corp',
    name: 'Acme',
    taxId: '12-3456789',
    type: 'LLC',
    incorporationDate: '2020-01-15',
    addressLine1: '123 Business St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States'
  }
};

const businessResult: RegisterResult =
  await identity.origins.register('bloque-api', businessParams);
```

## Use with Main SDK

When using through the main `@bloque/sdk` package:

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// All identity features are available under bloque.identity
const alias = await bloque.identity.aliases.get('user@example.com');
const otp = await bloque.identity.origins.whatsapp.assert('+1234567890');
```

## Key Features

### Identity Registration

- **Individual Registration (KYC)**: Register users with Know Your Customer compliance
- **Business Registration (KYB)**: Register businesses with Know Your Business compliance
- **Multi-Method Authentication**: Support for blockchain signatures, API keys, OAuth, WebAuthn, OTP, and passwords
- **Cross-Origin Support**: Register identities across multiple authentication origins
- **Secure Token Generation**: Receive JWT access tokens for authenticated sessions

### Origin Management

- **List Origins**: Retrieve all available authentication origins
- **Filter by Provider**: Find origins by provider type (evm, auth0, whatsapp, etc.)
- **Check Status**: Monitor origin availability and status
- **Custom Registration**: Register to custom authentication providers

### OTP Authentication Channels

- **WhatsApp**: Send OTP codes via WhatsApp messages
- **Email**: Send OTP codes via email
- **Custom Origins**: Integrate custom authentication providers

### Rate Limiting & Security

OTP assertions include built-in rate limiting:
- `attempts_remaining`: Track remaining OTP attempts
- `expires_at`: Unix timestamp for OTP expiration
- Automatic retry protection

### Alias Management

- Retrieve user information by email or phone
- Check user status (active, inactive, revoked)
- Support for primary and public aliases
- Rich metadata support

### Compliance Support

- **KYC (Know Your Customer)**: Complete individual profile fields including identity verification
- **KYB (Know Your Business)**: Business entity information with beneficial owner details
- **Data Privacy**: Secure handling of sensitive personal and business information

## Requirements

- Node.js 22.x or higher / Bun 1.x or higher
- TypeScript 5.x or higher (for TypeScript projects)

## Links

- [Homepage](https://www.bloque.app)
- [Main SDK Documentation](../sdk/README.md)
- [GitHub Repository](https://github.com/bloque-app/sdk)
- [Issue Tracker](https://github.com/bloque-app/sdk/issues)

## Development

```bash
# Build the package
bun run build

# Watch mode
bun run dev

# Type checking
bun run typecheck

# Code quality checks
bun run check
```

## License

[MIT](../../LICENSE)

Copyright (c) 2025-present Bloque Copilot Inc.
