# Bloque SDK

Official TypeScript/JavaScript SDK for [Bloque](https://www.bloque.app) platform.

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

## Packages

This monorepo contains the following packages:

- **[@bloque/sdk](./packages/sdk)** - Main SDK package for Bloque platform integration
- **[@bloque/sdk-core](./packages/core)** - Core utilities, HTTP client, and shared types
- **[@bloque/sdk-orgs](./packages/orgs)** - Organizations API client
- **[@bloque/sdk-compliance](./packages/compliance)** - Compliance and KYC verification API client
- **[@bloque/sdk-accounts](./packages/accounts)** - Accounts and virtual cards API client
- **[@bloque/sdk-identity](./packages/identity)** - Identity and aliases API client

## Installation

```bash
bun add @bloque/sdk
```

## Quick Start

```typescript
import { SDK } from '@bloque/sdk';

const bloque = new SDK({
  origin: 'your-origin', // Required: your origin identifier
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
  mode: 'production', // or 'sandbox'
  platform: 'node', // optional: 'node' | 'bun' | 'deno'
});

// Connect to a user session
const userSession = await bloque.connect('user-alias');

// Create a virtual card
const card = await userSession.accounts.card.create({
  urn: 'did:bloque:your-origin:user-alias',
  name: 'My Virtual Card',
});

console.log('Card created:', card.urn);
console.log('Last four digits:', card.lastFour);

// Create a Polygon wallet
const wallet = await userSession.accounts.polygon.create({
  metadata: {
    purpose: 'web3-transactions',
  },
});

console.log('Polygon wallet created:', wallet.address);
```

For detailed documentation, see the [@bloque/sdk package README](./packages/sdk/README.md).

## Development

### Prerequisites

- One of the supported runtimes: Node.js 22.x+, Bun 1.x+, Deno, or modern browsers
- TypeScript 5.x or higher (optional, for TypeScript projects)

### Setup

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Clean all packages
bun run clean
```

### Available Scripts

- `bun run build` - Build all packages in the correct order
- `bun run clean` - Clean all package builds and node_modules
- `bun run changeset` - Create a new changeset for versioning
- `bun run version` - Apply changesets and version packages
- `bun run publish` - Publish packages to npm

### Package Development

Each package has its own development scripts:

```bash
# Navigate to a package
cd packages/sdk

# Build the package
bun run build

# Watch mode for development
bun run dev

# Type check
bun run typecheck

# Code quality checks
bun run check
```

## Contributing

Contributions are welcome! Please ensure all tests pass and code quality checks are satisfied before submitting a PR.

## License

[MIT](./LICENSE)

Copyright (c) 2025-present Bloque Copilot Inc.

## Links

- [Homepage](https://www.bloque.app)
- [GitHub Repository](https://github.com/bloque-app/sdk)
- [Issue Tracker](https://github.com/bloque-app/sdk/issues)
