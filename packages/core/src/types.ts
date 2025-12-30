export type Mode =
  /**
   * Production environment.
   *
   * Uses live endpoints and real data.
   * This is the default mode.
   */
  | 'production'

  /**
   * Sandbox environment.
   *
   * Uses isolated endpoints and mock data for development and testing.
   */
  | 'sandbox';

export type Platform =
  /**
   * Node.js runtime.
   *
   * Intended for backend environments running on Node.js.
   *
   * Typical use cases:
   * - APIs
   * - Backend services
   * - Server-side workers
   *
   * Supports the use of private API keys.
   */
  | 'node'

  /**
   * Deno runtime.
   *
   * Intended for backend environments running on Deno.
   *
   * Typical use cases:
   * - Serverless functions
   * - Edge-like services
   *
   * Supports the use of private API keys.
   */
  | 'deno'

  /**
   * Bun runtime.
   *
   * Intended for backend environments running on Bun.
   *
   * Typical use cases:
   * - High-performance backend services
   * - Local development servers
   *
   * Supports the use of private API keys.
   */
  | 'bun'

  /**
   * Browser runtime.
   *
   * Intended for web browsers and browser-like environments.
   *
   * Characteristics:
   * - No access to private API keys
   * - Authentication is performed via JWT
   * - Token persistence must be explicitly configured
   *   (e.g. localStorage, sessionStorage, in-memory)
   */
  | 'browser'

  /**
   * React Native runtime.
   *
   * Intended for React Native applications (iOS / Android).
   *
   * Characteristics:
   * - No access to private API keys
   * - Authentication is performed via JWT
   * - Token persistence must be provided by the consumer
   *   (e.g. AsyncStorage, secure storage, in-memory)
   */
  | 'react-native';

/**
 * Interface that defines how the SDK stores and retrieves
 * the JWT token when running in `client` runtime.
 *
 * This allows consumers to customize the storage mechanism
 * (localStorage, sessionStorage, cookies, in-memory, etc.).
 */
export interface TokenStorage {
  /**
   * Retrieves the currently stored JWT.
   *
   * @returns The JWT token, or `null` if no token is stored.
   */
  get(): string | null;

  /**
   * Persists a JWT token.
   *
   * @param token The JWT token to store.
   */
  set(token: string): void;

  /**
   * Clears the stored JWT token.
   */
  clear(): void;
}

export type AuthStrategy = { type: 'apiKey'; apiKey: string } | { type: 'jwt' };

/**
 * Main configuration object for the Bloque SDK.
 *
 * This configuration is resolved once when initializing
 * the SDK (via `new SDK()` or `init()` in the modular API).
 */
export interface BloqueConfig {
  /**
   * Origin identifier for the SDK.
   *
   * Used to scope requests and operations
   * to a specific origin within the Bloque platform.
   */
  origin: string;
  /**
   * Platform where the SDK is executed.
   *
   * Determines the runtime environment and its capabilities.
   *
   * - `node` (default): backend runtime (Node.js, Bun, Deno).
   *   Supports authentication using private API keys.
   *
   * - `browser`: web browser environment.
   *   Does not allow private API keys.
   *   Authentication must be performed using JWT.
   *
   * - `react-native`: React Native environment (iOS / Android).
   *   Does not allow private API keys.
   *   Authentication must be performed using JWT.
   *
   * If not specified, the SDK defaults to `node`.
   */
  platform?: Platform;

  /**
   * Authentication strategy used by the SDK.
   *
   * - `apiKey`: intended for backend platforms (`node`, `bun`, `deno`).
   * - `jwt`: intended for frontend platforms (`browser`, `react-native`).
   *
   * The SDK validates the compatibility between the selected
   * platform and the authentication strategy at runtime.
   */
  auth: AuthStrategy;
  /**
   * SDK operation mode.
   *
   * - `production` (default): production environment.
   * - `sandbox`: sandbox environment.
   *
   * If not specified, the SDK defaults to `production`.
   */
  mode?: Mode;
  /**
   * JWT token storage strategy.
   *
   * Only applies when `runtime` is set to `client`.
   *
   * By default, the SDK uses `localStorage` to persist
   * the JWT token. This behavior can be overridden to
   * use alternative storage mechanisms.
   */
  tokenStorage?: TokenStorage;

  /**
   * Optional access token to be used for authentication.
   *
   * Mainly intended for internal use or advanced scenarios.
   */
  accessToken?: string;

  /**
   * Optional user URN to scope the SDK instance to a specific user.
   *
   * Mainly intended for internal use or advanced scenarios.
   */
  urn?: string;
}

export interface RequestOptions<U = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: U;
  headers?: Record<string, string>;
}

export interface BloqueResponse<T> {
  data?: T;
  error?: BloqueError;
}

export interface BloqueError {
  message: string;
  code?: string;
  status?: number;
}
