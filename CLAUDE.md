# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime and Package Manager

Default to using Bun instead of Node.js:

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv

## Monorepo Architecture

This is a **Bun workspace monorepo** with 6 packages that build upon each other:

```
packages/
├── core/         # Base: HttpClient, BaseClient, errors, types
├── accounts/     # Accounts API (cards, virtual, Polygon, Bancolombia)
├── orgs/         # Organizations API
├── compliance/   # KYC/KYB verification
├── identity/     # Identity and aliases
└── sdk/          # Main SDK (aggregates all packages)
```

**Dependency hierarchy** (critical for builds):
- `core` is the foundation - all packages depend on it
- `accounts`, `orgs`, `compliance`, `identity` can build in parallel
- `sdk` depends on all packages and must build last

## Building

**Build order matters due to package dependencies.**

```bash
# Build everything (handles dependencies automatically)
bun run build

# Build individual packages (use filters)
bun run build:core        # Must build first
bun run build:accounts    # Requires core
bun run build:sdk         # Requires all packages

# Watch mode for development
bun run dev               # All packages in parallel
```

**Build system**: RSLib (Rust-based bundler)
- Outputs: ESM (`dist/index.js`) and CommonJS (`dist/index.cjs`)
- TypeScript declarations auto-generated (`.d.ts`)
- Target: Node.js 22+, minified by default

## Code Quality

**Biome** is the single tool for linting and formatting:

```bash
# Format and lint (per package)
cd packages/accounts
bun run check             # biome check --write

# Git hooks via Lefthook (auto-installed on bun install)
# Pre-commit: runs typecheck + biome on staged files
```

**Code style**:
- Single quotes for JavaScript/TypeScript
- Space indentation (configured in `biome.json`)
- Organize imports automatically
- Recommended rules enabled

## Client Architecture Pattern

All packages follow the **BaseClient pattern**:

```typescript
// 1. Core package provides the base
abstract class BaseClient {
  protected readonly httpClient: HttpClient;
}

// 2. Each package extends BaseClient
class AccountsClient extends BaseClient {
  // 3. Sub-clients for specific domains
  readonly card: CardClient;
  readonly virtual: VirtualClient;
  readonly polygon: PolygonClient;
  readonly bancolombia: BancolombiaClient;
}
```

**Key architectural principles**:
- **HttpClient centralization**: All HTTP logic lives in `core` package
- **Lazy initialization**: Clients created only when `SDK.connect()` is called
- **Sub-client composition**: Domain-specific clients (e.g., `card`, `polygon`) are properties of parent clients
- **Shared error handling**: All packages use error classes from `core`

## Working with Accounts

When adding new account types:

1. **Add wire types** to `packages/accounts/src/internal/wire-types.ts`:
   - `CreateXAccountInput` (API request format, snake_case)
   - `XDetails` (API response format, snake_case)

2. **Create type definitions** in `packages/accounts/src/x/types.ts`:
   - `CreateXAccountParams` (SDK params, camelCase)
   - `XAccount` (SDK response, camelCase)
   - `UpdateXMetadataParams` if applicable

3. **Implement client** in `packages/accounts/src/x/x-client.ts`:
   - Extend `BaseClient`
   - Implement `create()`, `updateMetadata()`, `activate()`, `freeze()`, `disable()`
   - Private `_mapAccountResponse()` to convert wire types to SDK types

4. **Register in AccountsClient** (`packages/accounts/src/accounts-client.ts`):
   - Add property: `readonly x: XClient`
   - Initialize in constructor

5. **Export** from `packages/accounts/src/index.ts`

6. **Update documentation**:
   - `website/es/guide/accounts/x.mdx` (Spanish)
   - `website/en/guide/accounts/x.mdx` (English)
   - Update `_meta.json` in both languages
   - Update README files

**Important**: Do NOT expose `holderUrn` parameter in public documentation - it's for internal SDK use only.

## HTTP Client and Error Handling

The `HttpClient` (in `core` package) provides:

- **Automatic retry** with exponential backoff (configurable via `retry` config)
- **Timeout handling** via AbortController (default: 30s)
- **Rate limit handling** (respects `Retry-After` header)
- **Platform-specific auth**:
  - Backend (node/bun/deno): API key
  - Frontend (browser/react-native): JWT with token storage

**Error hierarchy** (all errors extend `BloqueAPIError`):
- `BloqueRateLimitError` (429)
- `BloqueAuthenticationError` (401)
- `BloqueValidationError` (400)
- `BloqueNotFoundError` (404)
- `BloqueInsufficientFundsError`
- `BloqueNetworkError`
- `BloqueTimeoutError`
- `BloqueConfigError`

All errors include `requestId`, `timestamp`, and `toJSON()` for logging.

## Multi-Platform Support

The SDK supports 5 platforms: `node` | `bun` | `deno` | `browser` | `react-native`

**Backend platforms** (node/bun/deno):
- Use API key authentication
- No token storage needed

**Frontend platforms** (browser/react-native):
- Use JWT authentication
- Require `TokenStorage` interface implementation
- Browser defaults to localStorage (with security warning)
- React Native should use AsyncStorage or secure storage

## TypeScript Configuration

- **Strict mode enabled** across all packages
- **Module resolution**: bundler mode (allows importing `.ts` files)
- **Target**: ESNext (no transpilation)
- **Type checking**: Use `bun run typecheck` (via tsgo)

## Testing

Currently no test framework configured. If adding tests:
- Use `bun test` (Bun's built-in test runner)
- Pattern: `*.test.ts` files

## Release Process

Uses **Changesets** for versioning:

```bash
# 1. Create a changeset
bun run changeset

# 2. Version packages (updates package.json)
bun run version

# 3. Publish (handled by GitHub Actions)
bun run release
```

All packages versioned together (currently v0.0.25).

## Common Workflows

**Adding a new package**:
1. Create in `packages/new-package/`
2. Add to root `package.json` workspaces
3. Depend on `@bloque/sdk-core` (workspace:*)
4. Follow naming: `@bloque/sdk-{name}`
5. Update build scripts in root `package.json`

**Making API changes**:
1. Update wire types in respective package (snake_case)
2. Update SDK types (camelCase)
3. Update client implementation
4. Run `bun run build` to verify
5. Update documentation in both languages

**Code formatting**:
```bash
bun run check    # From any package directory
```

**Verifying changes**:
```bash
bun run build    # Ensures no TypeScript errors
```
