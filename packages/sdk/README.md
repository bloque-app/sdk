# Bloque SDK

The official TypeScript/JavaScript SDK for integrating [Bloque](https://www.bloque.app) into your applications.

> **⚠️ Development Notice**
>
> This SDK is currently under active development. Breaking changes may occur between versions.
> We strongly recommend pinning to a specific version in your `package.json` to avoid unexpected issues.

## Platform Support

- **Node.js** 22.x or higher
- **Bun** 1.x or higher
- **Deno** Latest version
- **Web/Browsers** Modern browsers with ES2020+ support
- **React Native** Latest version

## Installation

```bash
pnpm install @bloque/sdk
```

## Quick Start

```typescript
import { SDK } from '@bloque/sdk';

// Initialize SDK
const bloque = await SDK.connect({
  apiKey: process.env.BLOQUE_API_KEY!,
  platform: 'node',
});
const bloque = new SDK({
  origin: 'bloque',
  auth: {
    type: 'apiKey',
    apiKey: 'sk_live_862f110...',
  },
  mode: 'production', // or 'sandbox' for testing
  platform: 'node',
});

// Create a virtual card
const card = await bloque.accounts.card.create({
  name: 'My Virtual Card',
});

console.log('Card created:', card.urn);
```

## Documentation

For complete documentation, examples, and guides, visit:

**[https://docs.bloque.app/sdk](https://docs.bloque.app/sdk)**

The documentation includes:

- Getting started guides
- Account management (Virtual Cards, US Accounts, Polygon, Bancolombia)
- Identity and authentication
- Transfers and transactions
- Error handling
- TypeScript support
- Advanced configuration

## Support

- **Documentation**: [docs.bloque.app/sdk](https://docs.bloque.app/sdk)
- **GitHub Issues**: [github.com/bloque/sdk/issues](https://github.com/bloque/sdk/issues)

## License

[MIT](../../LICENSE) © [Bloque](https://www.bloque.app)
