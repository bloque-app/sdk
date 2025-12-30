# @bloque/sdk-compliance

Compliance and KYC verification client for the [Bloque](https://www.bloque.app) platform.

## Features

- **KYC Verification**: Start and manage Know Your Customer verification processes
- **TypeScript First**: Built with TypeScript for complete type safety
- **Fully Async**: Promise-based API for modern JavaScript workflows
- **Lightweight**: Minimal dependencies for optimal bundle size

> **📌 Important:** All compliance operations require connecting to a user session first using `bloque.connect(urn)`. This ensures proper authentication and authorization for user-specific operations. See the [Usage](#usage) section for details.

## Installation

This package is included in the main `@bloque/sdk` package. You typically don't need to install it separately.

```bash
bun add @bloque/sdk
```

If you need to use this package standalone:

```bash
bun add @bloque/sdk-compliance @bloque/sdk-core
```

## Usage

### With the Main SDK (Recommended)

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  origin: 'your-origin', // Required: your origin identifier
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

// Connect to user session first
const userSession = await bloque.connect('did:bloque:your-origin:user-alias');

// Start KYC verification through the session
const verification = await userSession.compliance.kyc.startVerification({
  urn: 'did:bloque:your-origin:user-alias',
});

console.log('Verification URL:', verification.url);
console.log('Status:', verification.status);
```

### Standalone Usage

```typescript
import { ComplianceClient } from '@bloque/sdk-compliance';
import { HttpClient } from '@bloque/sdk-core';

const httpClient = new HttpClient({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

const compliance = new ComplianceClient(httpClient);

const verification = await compliance.kyc.startVerification({
  urn: 'did:bloque:origin:user-123',
});
```

## API Reference

### KYC Verification

#### `startVerification(params)`

Initiates a KYC verification process for a user.

**Parameters**:

```typescript
interface KycVerificationParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the user
   * within the system.
   *
   * This value is used to associate the KYC verification process
   * with a specific user.
   *
   * @example "did:bloque:origin:user-123"
   */
  urn: string;

  /**
   * URL where webhook notifications will be sent when the verification
   * status changes.
   *
   * This is optional. If provided, the platform will send POST requests
   * to this URL with verification status updates.
   *
   * @example "https://api.example.com/webhooks/kyc"
   */
  webhookUrl?: string;
}
```

**Returns**:

```typescript
interface KycVerificationResponse {
  /**
   * URL where the user should complete the verification process.
   * Redirect the user to this URL to complete KYC.
   */
  url: string;

  /**
   * Current status of the verification
   */
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
}
```

**Example**:

```typescript
const verification = await bloque.compliance.kyc.startVerification({
  urn: 'did:bloque:origin:user-123',
  webhookUrl: 'https://api.example.com/webhooks/kyc', // Optional
});

// Redirect user to verification.url
window.location.href = verification.url;
```

#### `getVerification(params)`

Retrieves the current status of a KYC verification.

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

**Returns**:

```typescript
interface KycVerificationResponse {
  /**
   * Current status of the verification
   */
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';

  /**
   * URL where the user can complete or view the verification
   */
  url: string;

  /**
   * Date when the verification was completed (ISO 8601 format)
   * null if verification is not yet completed
   */
  completedAt: string | null;
}
```

**Example**:

```typescript
const status = await bloque.compliance.kyc.getVerification({
  urn: 'did:bloque:user:123e4567',
});

console.log('Status:', status.status);
console.log('Completed At:', status.completedAt);

if (status.status === 'approved') {
  console.log('Verification approved!');
}
```

## Complete Examples

### Basic KYC Verification

```typescript
import { SDK } from '@bloque/sdk';
import type { KycVerificationParams } from '@bloque/sdk-compliance';

const bloque = new SDK({
  origin: 'your-origin',
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production',
});

async function startUserVerification(
  userUrn: string,
  webhookUrl?: string,
) {
  try {
    // Connect to user session
    const userSession = await bloque.connect(userUrn);

    const params: KycVerificationParams = {
      urn: userUrn,
      webhookUrl,
    };

    const verification = await userSession.compliance.kyc.startVerification(params);

    console.log('✓ Verification started');
    console.log('  URL:', verification.url);
    console.log('  Status:', verification.status);

    return verification;
  } catch (error) {
    console.error('Failed to start verification:', error);
    throw error;
  }
}

// Usage
await startUserVerification(
  'did:bloque:your-origin:user-alias',
  'https://api.example.com/webhooks/kyc',
);
```

### Getting Verification Status

```typescript
import { SDK } from '@bloque/sdk';
import type { GetKycVerificationParams } from '@bloque/sdk-compliance';

const bloque = new SDK({
  apiKey: process.env.BLOQUE_API_KEY!,
  mode: 'production',
});

async function checkVerificationStatus(userUrn: string) {
  try {
    const params: GetKycVerificationParams = {
      urn: userUrn,
    };

    const status = await bloque.compliance.kyc.getVerification(params);

    console.log('✓ Verification status retrieved');
    console.log('  Status:', status.status);
    console.log('  Verification URL:', status.url);
    console.log('  Completed At:', status.completedAt);

    return status;
  } catch (error) {
    console.error('Failed to get verification status:', error);
    throw error;
  }
}

// Usage
await checkVerificationStatus('did:bloque:user:123e4567');
```

## TypeScript Support

This package is written in TypeScript and includes complete type definitions:

```typescript
import type {
  ComplianceClient,
  KycClient,
  KycVerificationParams,
  KycVerificationResponse,
  GetKycVerificationParams,
} from '@bloque/sdk-compliance';

// Type-safe verification start
const startParams: KycVerificationParams = {
  urn: 'did:bloque:origin:user-123',
  webhookUrl: 'https://api.example.com/webhooks/kyc', // Optional
};

const verification: KycVerificationResponse =
  await bloque.compliance.kyc.startVerification(startParams);

// Type-safe verification status check
const statusParams: GetKycVerificationParams = {
  urn: 'did:bloque:user:123e4567',
};

const status: KycVerificationStatus =
  await bloque.compliance.kyc.getVerification(statusParams);
```

## Error Handling

Always wrap API calls in try-catch blocks:

```typescript
// Start verification
try {
  const verification = await bloque.compliance.kyc.startVerification({
    urn: userUrn,
  });
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    console.error('Verification failed:', error.message);
  }
  // Handle error
}

// Get verification status
try {
  const status = await bloque.compliance.kyc.getVerification({
    urn: userUrn,
  });
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to get status:', error.message);
  }
  // Handle error
}
```

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
