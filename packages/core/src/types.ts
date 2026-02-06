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
 *
 * ⚠️ SECURITY CONSIDERATIONS:
 *
 * **localStorage / sessionStorage (INSECURE)**:
 * - Vulnerable to XSS attacks - any malicious script can read the token
 * - Should ONLY be used for development/testing or non-sensitive apps
 * - NOT recommended for production applications handling sensitive data
 *
 * **httpOnly Cookies (RECOMMENDED)**:
 * - Best security practice - not accessible to JavaScript
 * - Protects against XSS attacks
 * - Requires server-side cooperation to set cookies
 *
 * **Secure Storage (RECOMMENDED for mobile)**:
 * - Use platform-specific secure storage (e.g., Keychain on iOS, Keystore on Android)
 * - Libraries: @react-native-async-storage/async-storage, expo-secure-store
 *
 * **In-Memory Storage**:
 * - Most secure against XSS
 * - Token lost on page refresh/app restart
 * - Good for short-lived sessions
 *
 * Example implementation using httpOnly cookies:
 * ```typescript
 * const cookieStorage: TokenStorage = {
 *   get: () => {
 *     // Token is automatically sent in httpOnly cookie
 *     // You may need to fetch from server or return null
 *     return null;
 *   },
 *   set: (token) => {
 *     // Send to server to set httpOnly cookie
 *     fetch('/api/auth/set-token', {
 *       method: 'POST',
 *       body: JSON.stringify({ token })
 *     });
 *   },
 *   clear: () => {
 *     // Call server to clear cookie
 *     fetch('/api/auth/logout', { method: 'POST' });
 *   }
 * };
 * ```
 *
 * @see https://owasp.org/www-community/attacks/xss/
 * @see https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage
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
   * ⚠️ WARNING: If using localStorage/sessionStorage, this token will be
   * accessible to any JavaScript code on the page, including malicious scripts.
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
 * Public configuration object for the Bloque SDK.
 *
 * This is the configuration interface that users should use when
 * initializing the SDK (via `new SDK()` or `init()` in the modular API).
 *
 * @public
 */
export interface BloqueSDKConfig {
  /**
   * Base URL for the SDK.
   *
   * If not specified, the SDK defaults to the production environment.
   * If specified, the SDK will use the base URL for all requests.
   */
  baseUrl?: string;

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
   * Only applies when `platform` is set to `browser` or `react-native`.
   *
   * **Default behavior (browser only)**:
   * - The SDK uses `localStorage` by default for browser platform
   * - ⚠️ localStorage is INSECURE and vulnerable to XSS attacks
   * - A security warning will be logged to the console
   *
   * **For production applications**, provide a custom `tokenStorage` using:
   * - httpOnly cookies (recommended - immune to XSS)
   * - Secure storage libraries (for React Native)
   * - sessionStorage (slightly better than localStorage, but still vulnerable)
   * - In-memory storage (most secure, but lost on refresh)
   *
   * @see TokenStorage for security considerations and examples
   */
  tokenStorage?: TokenStorage;

  /**
   * Default timeout for HTTP requests in milliseconds.
   *
   * If a request takes longer than this timeout, it will be aborted
   * and throw a BloqueAPIError with code 'TIMEOUT_ERROR'.
   *
   * Can be overridden per-request using the `timeout` option in RequestOptions.
   *
   * Set to 0 to disable timeouts globally (not recommended for production).
   *
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Retry configuration for failed requests.
   *
   * When enabled, the SDK will automatically retry failed requests with
   * exponential backoff for the following scenarios:
   * - 429 (Too Many Requests)
   * - 503 (Service Unavailable)
   * - Network errors (timeouts, connection failures)
   *
   * The SDK respects the `Retry-After` header when present.
   *
   * @default { enabled: true, maxRetries: 3, initialDelay: 1000 }
   */
  retry?: {
    /**
     * Whether to enable automatic retries.
     * @default true
     */
    enabled?: boolean;

    /**
     * Maximum number of retry attempts.
     * @default 3
     */
    maxRetries?: number;

    /**
     * Initial delay in milliseconds before the first retry.
     * Subsequent retries use exponential backoff: delay * (2 ^ attempt).
     * @default 1000 (1 second)
     */
    initialDelay?: number;

    /**
     * Maximum delay in milliseconds between retries.
     * Prevents exponential backoff from growing too large.
     * @default 30000 (30 seconds)
     */
    maxDelay?: number;
  };
}

/**
 * Internal configuration object with runtime state.
 *
 * Extends the public configuration with internal fields that are
 * managed by the SDK at runtime (access tokens, session state, etc.).
 *
 * @internal - This interface is not part of the public API.
 * Users should not depend on these fields as they may change without notice.
 */
export interface BloqueInternalConfig extends BloqueSDKConfig {
  /**
   * Access token for authenticated requests.
   *
   * @internal
   * Set internally after successful authentication (register/connect).
   * Should not be accessed or modified by SDK users.
   */
  accessToken?: string;

  /**
   * URN of the currently connected identity.
   *
   * @internal
   * Set internally when connecting to a user session.
   * Should not be accessed or modified by SDK users.
   */
  urn?: string;
}

export interface RequestOptions<U = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: U;
  headers?: Record<string, string>;
  /**
   * Request timeout in milliseconds.
   *
   * If not specified, uses the default timeout from SDK config.
   * Set to 0 to disable timeout for this specific request.
   *
   * When a request exceeds the timeout, it will be aborted and
   * throw a BloqueAPIError with code 'TIMEOUT_ERROR'.
   *
   * @default 30000 (30 seconds)
   */
  timeout?: number;
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
