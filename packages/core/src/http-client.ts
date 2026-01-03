import { API_BASE_URLS, DEFAULT_HEADERS } from './constants';
import { BloqueAPIError, BloqueConfigError } from './errors';
import type {
  BloqueInternalConfig,
  BloqueSDKConfig,
  RequestOptions,
  TokenStorage,
} from './types';

const isFrontendPlatform = (platform?: string) =>
  platform === 'browser' || platform === 'react-native';

/**
 * Creates a localStorage-based token storage adapter.
 *
 * ⚠️ SECURITY WARNING: localStorage is vulnerable to XSS attacks.
 * Tokens stored in localStorage can be accessed by any JavaScript code
 * running in the same origin, including malicious scripts injected via XSS.
 *
 * For production applications, consider using:
 * - httpOnly cookies (best option, not accessible to JavaScript)
 * - secure storage libraries (e.g., @react-native-async-storage/async-storage for React Native)
 * - sessionStorage (slightly better, cleared when tab closes, but still vulnerable to XSS)
 * - encrypted storage solutions
 *
 * Only use localStorage for:
 * - Development and testing
 * - Non-sensitive applications
 * - When you fully trust all scripts on your page
 *
 * @internal
 */
const createLocalStorageAdapter = (): TokenStorage => {
  // Emit warning once when adapter is created
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      '[Bloque SDK Security Warning] Using localStorage for token storage. ' +
        'localStorage is vulnerable to XSS attacks. ' +
        'For production use, provide a custom tokenStorage with httpOnly cookies or secure storage. ' +
        'See: https://owasp.org/www-community/attacks/xss/',
    );
  }

  return {
    get: () => {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage.getItem('access_token');
    },
    set: (token: string) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('access_token', token);
      }
    },
    clear: () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
      }
    },
  };
};

export class HttpClient {
  /**
   * Internal configuration with runtime state.
   * @internal - Do not access directly. Use public getters instead.
   * This field is private to prevent external access and mutations.
   */
  private readonly _config: BloqueInternalConfig;
  private readonly baseUrl: string;

  private readonly publicRoutes = [
    '/api/aliases',
    '/api/origins/*/assert',
    '/api/origins',
  ];

  constructor(config: BloqueSDKConfig) {
    // Clone config to prevent external mutations
    const internalConfig: BloqueInternalConfig = { ...config };
    this.validateConfig(internalConfig);
    this._config = internalConfig;
    this.baseUrl = API_BASE_URLS[config.mode ?? 'production'];
  }

  /**
   * Get the origin identifier.
   * @public
   */
  get origin(): string {
    return this._config.origin;
  }

  /**
   * Get the authentication strategy.
   * @public
   */
  get auth() {
    return this._config.auth;
  }

  /**
   * Get the URN of the currently connected identity.
   * @public
   * @returns The URN if a session is active, undefined otherwise.
   */
  get urn(): string | undefined {
    return this._config.urn;
  }

  /**
   * Set the access token for authenticated requests.
   * @internal - Called internally after successful authentication.
   */
  setAccessToken(token: string): void {
    this._config.accessToken = token;
  }

  /**
   * Set the URN of the connected identity.
   * @internal - Called internally when connecting to a user session.
   */
  setUrn(urn: string): void {
    this._config.urn = urn;
  }

  private validateConfig(config: BloqueInternalConfig): void {
    config.mode ??= 'production';
    config.platform ??= 'node';
    config.timeout ??= 30000; // 30 seconds default

    // Set default retry configuration
    config.retry ??= {};
    config.retry.enabled ??= true;
    config.retry.maxRetries ??= 3;
    config.retry.initialDelay ??= 1000; // 1 second
    config.retry.maxDelay ??= 30000; // 30 seconds

    if (!['sandbox', 'production'].includes(config.mode)) {
      throw new BloqueConfigError(
        'Mode must be either "sandbox" or "production"',
      );
    }

    if (config.timeout !== undefined && config.timeout < 0) {
      throw new BloqueConfigError('Timeout must be a non-negative number');
    }

    if (config.retry.maxRetries !== undefined && config.retry.maxRetries < 0) {
      throw new BloqueConfigError('maxRetries must be a non-negative number');
    }

    if (
      config.retry.initialDelay !== undefined &&
      config.retry.initialDelay < 0
    ) {
      throw new BloqueConfigError('initialDelay must be a non-negative number');
    }

    if (config.retry.maxDelay !== undefined && config.retry.maxDelay < 0) {
      throw new BloqueConfigError('maxDelay must be a non-negative number');
    }

    if (config.auth.type === 'apiKey') {
      if (!config.auth.apiKey?.trim()) {
        throw new BloqueConfigError(
          'API key is required for apiKey authentication',
        );
      }

      if (isFrontendPlatform(config.platform)) {
        throw new BloqueConfigError(
          'API key authentication is not allowed in frontend platforms',
        );
      }
    }

    if (config.auth.type === 'jwt') {
      if (!config.tokenStorage) {
        if (config.platform === 'browser') {
          config.tokenStorage = createLocalStorageAdapter();
        } else {
          throw new BloqueConfigError(
            'tokenStorage must be provided when using JWT authentication',
          );
        }
      }
    }
  }

  private isPublicRoute(path: string): boolean {
    const pathWithoutQuery = path.split('?')[0];
    return this.publicRoutes.some((route) => {
      const pattern = route.replace(/\*/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathWithoutQuery);
    });
  }

  private buildAuthHeaders(path: string): Record<string, string> {
    if (this.isPublicRoute(path)) {
      return {};
    }

    if (this._config.auth.type === 'apiKey') {
      if (this._config.accessToken) {
        return {
          Authorization: `Bearer ${this._config.accessToken}`,
        };
      }
      return {
        Authorization: this._config.auth.apiKey,
      };
    }

    if (this._config.auth.type === 'jwt') {
      const token = this._config.tokenStorage?.get();
      if (!token) {
        throw new BloqueConfigError('Authentication token is missing');
      }

      return {
        Authorization: `Bearer ${token}`,
      };
    }

    return {};
  }

  /**
   * Determines if an error is retryable.
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof BloqueAPIError) {
      // Retry on 429 (Too Many Requests) and 503 (Service Unavailable)
      return error.status === 429 || error.status === 503;
    }

    // Retry on network errors and timeouts
    if (error instanceof Error) {
      return (
        error.name === 'AbortError' ||
        error.message.includes('NETWORK_ERROR') ||
        error.message.includes('TIMEOUT_ERROR')
      );
    }

    return false;
  }

  /**
   * Calculates the delay before the next retry attempt.
   * Respects the Retry-After header if present, otherwise uses exponential backoff.
   */
  private calculateRetryDelay(
    attempt: number,
    retryAfterHeader?: string,
  ): number {
    const { initialDelay = 1000, maxDelay = 30000 } = this._config.retry ?? {};

    // Respect Retry-After header if present
    if (retryAfterHeader) {
      const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10);
      if (!Number.isNaN(retryAfterSeconds)) {
        return Math.min(retryAfterSeconds * 1000, maxDelay);
      }

      // Retry-After might be an HTTP date
      const retryAfterDate = new Date(retryAfterHeader);
      if (!Number.isNaN(retryAfterDate.getTime())) {
        const delay = retryAfterDate.getTime() - Date.now();
        return Math.min(Math.max(delay, 0), maxDelay);
      }
    }

    // Exponential backoff: initialDelay * (2 ^ attempt)
    const exponentialDelay = initialDelay * 2 ** attempt;

    // Add jitter (±25%) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Sleeps for the specified duration in milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async request<T, U = unknown>(options: RequestOptions<U>): Promise<T> {
    const { method, path, body, headers = {}, timeout } = options;
    const url = `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...this.buildAuthHeaders(path),
      ...headers,
    };

    // Determine the timeout to use (per-request timeout or default config timeout)
    const effectiveTimeout =
      timeout !== undefined ? timeout : (this._config.timeout ?? 30000);

    const { enabled: retryEnabled = true, maxRetries = 3 } =
      this._config.retry ?? {};

    let lastError: Error | undefined;
    let attempt = 0;

    // Retry loop
    while (attempt <= (retryEnabled ? maxRetries : 0)) {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      // Set up timeout only if effectiveTimeout > 0
      if (effectiveTimeout > 0) {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, effectiveTimeout);
      }

      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        // Clear timeout on successful response
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorData = responseData as {
            message?: string;
            code?: string;
          };
          const apiError = new BloqueAPIError(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.code,
          );

          // Check if this error is retryable
          if (
            retryEnabled &&
            attempt < maxRetries &&
            this.isRetryableError(apiError)
          ) {
            lastError = apiError;
            const retryAfter = response.headers.get('Retry-After') ?? undefined;
            const delay = this.calculateRetryDelay(attempt, retryAfter);
            await this.sleep(delay);
            attempt++;
            continue;
          }

          throw apiError;
        }

        // Success!
        return responseData as T;
      } catch (error) {
        // Clear timeout on error
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }

        // Re-throw if it's already a BloqueAPIError (from the !response.ok block above)
        if (error instanceof BloqueAPIError && !this.isRetryableError(error)) {
          throw error;
        }

        let processedError: Error;

        // Handle AbortError (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          processedError = new BloqueAPIError(
            `Request timeout after ${effectiveTimeout}ms`,
            undefined,
            'TIMEOUT_ERROR',
          );
        } else if (error instanceof Error) {
          processedError = new BloqueAPIError(
            `Request failed: ${error.message}`,
            undefined,
            'NETWORK_ERROR',
          );
        } else {
          processedError = new BloqueAPIError(
            'Unknown error occurred',
            undefined,
            'UNKNOWN_ERROR',
          );
        }

        // Check if we should retry
        if (
          retryEnabled &&
          attempt < maxRetries &&
          this.isRetryableError(processedError)
        ) {
          lastError = processedError;
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          attempt++;
          continue;
        }

        throw processedError;
      }
    }

    // If we've exhausted all retries, throw the last error
    throw (
      lastError ||
      new BloqueAPIError(
        'Request failed after retries',
        undefined,
        'MAX_RETRIES_EXCEEDED',
      )
    );
  }
}
