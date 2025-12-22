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

export type Runtime =
  /**
   * Server runtime (default).
   *
   * Intended for backend environments such as Node.js, Bun,
   * Deno, Edge runtimes, or any server-side execution context.
   *
   * Allows the use of private API keys.
   */
  | 'server'

  /**
   * Client runtime.
   *
   * Intended for browsers or frontend runtimes.
   *
   * In the current version of the SDK:
   * - The client authenticates using the `auth` module.
   * - The SDK automatically obtains and manages a JWT.
   * - The JWT is used to authenticate all subsequent requests.
   * - An authenticated client can execute any operation
   *   exposed by the API.
   *
   * Authorization and security enforcement are handled
   * exclusively by the backend.
   */
  | 'client';

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

/**
 * Main configuration object for the Bloque SDK.
 *
 * This configuration is resolved once when initializing
 * the SDK (via `new SDK()` or `init()` in the modular API).
 */
export interface BloqueConfig {
  /**
   * Bloque API key.
   *
   * - In `server` runtime, a private API key is expected.
   * - In `client` runtime, the API key is not used directly;
   *   authentication is performed via JWT instead.
   */
  apiKey: string;
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
   * Runtime environment where the SDK is executed.
   *
   * - `server` (default): backend runtime using API keys.
   * - `client`: frontend runtime using JWT authentication.
   *
   * If not specified, the SDK defaults to `server`.
   */
  runtime?: 'server' | 'client';
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
