# Quick Start

## Installation

```bash
npm install @bloque/sdk
# or
bun add @bloque/sdk
```

## Configuration

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  origin: process.env.ORIGIN,       // Your origin identifier
  auth: {
    type: 'apiKey',                  // Backend: 'apiKey' | Frontend: 'jwt'
    apiKey: process.env.API_KEY,
  },
  mode: 'sandbox',                   // 'production' | 'sandbox'
  // platform: 'node',               // Auto-detected. Options: node | bun | deno | browser | react-native
  // timeout: 30000,                  // Default: 30s
  // retry: { enabled: true, maxRetries: 3, initialDelay: 1000 },
});
```

### Backend (Node.js / Bun / Deno)

Use API key authentication. The SDK sends the key in request headers.

```typescript
const bloque = new SDK({
  origin: process.env.ORIGIN,
  auth: { type: 'apiKey', apiKey: process.env.API_KEY },
  mode: 'sandbox',
});
```

### Frontend (Browser / React Native)

Use JWT authentication. Provide a `TokenStorage` implementation.

```typescript
const bloque = new SDK({
  origin: process.env.ORIGIN,
  auth: { type: 'jwt' },
  platform: 'browser',
  // Default: localStorage (insecure). For production, use httpOnly cookies:
  tokenStorage: {
    get: () => null, // Token sent via httpOnly cookie automatically
    set: (token) => fetch('/api/auth/set-token', {
      method: 'POST', body: JSON.stringify({ token })
    }),
    clear: () => fetch('/api/auth/logout', { method: 'POST' }),
  },
});
```

## Register a New User

```typescript
const session = await bloque.register('@alice', {
  type: 'individual',
  profile: {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    phone: '+1234567890',
    birthdate: '1990-01-01',
    city: 'Miami',
    state: 'FL',
    postalCode: '33101',
    countryOfBirthCode: 'US',
    countryOfResidenceCode: 'US',
  },
});
```

## Connect to an Existing User

```typescript
const user = await bloque.connect('@alice');
console.log('Connected:', user.urn);

// Now use any client:
// user.accounts.*       — Accounts, cards, transfers
// user.compliance.*     — KYC/KYB
// user.identity.*       — Aliases, origins
// user.orgs.*           — Organizations
// user.swap.*           — Currency swaps, PSE
```

## Supported Assets

| Asset | Symbol | Decimals | Description |
|-------|--------|----------|-------------|
| US Dollar | `DUSD/6` | 6 | `"10000000"` = 10.000000 USD |
| Colombian Peso | `COPB/6` | 6 | `"10000000"` = 10.000000 COP |
| Colombian Peso | `COPM/2` | 2 | `"1000"` = 10.00 COP |
| Kusama | `KSM/12` | 12 | `"1000000000000"` = 1 KSM |

**Important**: All amounts are raw integer strings. To convert:
- Human to raw: `amount * 10^decimals` → e.g., 50 DUSD = `"50000000"`
- Raw to human: `amount / 10^decimals` → e.g., `"50000000"` = 50 DUSD

## Environment Variables

```bash
ORIGIN=your-origin-id        # Your Bloque origin identifier
API_KEY=your-api-key         # Backend API key (never expose to frontend)
MODE=sandbox                 # production | sandbox
```

Bun loads `.env` automatically. No need for `dotenv`.
