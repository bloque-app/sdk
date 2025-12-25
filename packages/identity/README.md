# @bloque/sdk-identity

Identity, aliases, and OTP authentication API client for the Bloque SDK.

## Features

- **Aliases**: Get user identity information by email or phone
- **OTP Origins**: Send OTP codes via WhatsApp or Email
- **Custom Origins**: Support for custom authentication origins
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
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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

### Using Custom Origin

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
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
  apiKey: process.env.BLOQUE_API_KEY!,
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

## TypeScript Support

This package is written in TypeScript and includes complete type definitions:

```typescript
import type {
  Alias,
  OTPAssertionEmail,
  OTPAssertionWhatsApp,
  OTPAssertion,
  IdentityClient,
  AliasesClient,
  OriginsClient,
  OriginClient,
} from '@bloque/sdk-identity';

// Type-safe alias retrieval
const alias: Alias = await identity.aliases.get('user@example.com');

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
```

## Use with Main SDK

When using through the main `@bloque/sdk` package:

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

// All identity features are available under bloque.identity
const alias = await bloque.identity.aliases.get('user@example.com');
const otp = await bloque.identity.origins.whatsapp.assert('+1234567890');
```

## Key Features

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
