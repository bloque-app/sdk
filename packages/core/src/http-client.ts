import { API_BASE_URLS, DEFAULT_HEADERS } from './constants';
import {
  type BloqueAPIError,
  BloqueConfigError,
  BloqueNetworkError,
  BloqueRateLimitError,
  BloqueTimeoutError,
  createBloqueError,
} from './errors';
import type {
  BloqueInternalConfig,
  BloqueSDKConfig,
  RequestOptions,
} from './types';

const isFrontendPlatform = (platform?: string) =>
  platform === 'browser' || platform === 'react-native';

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
    '/api/origins/*/connect',
    '/api/origins',
  ];

  constructor(config: BloqueSDKConfig) {
    // Clone config to prevent external mutations
    const internalConfig: BloqueInternalConfig = { ...config };
    this.validateConfig(internalConfig);
    this._config = internalConfig;
    this.baseUrl =
      internalConfig.baseUrl ??
      API_BASE_URLS[internalConfig.mode ?? 'production'];
  }

  /**
   * Get the origin identifier.
   * @public
   */
  get origin(): string | undefined {
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
   * Persist JWT token in configured token storage, when provided.
   * @internal - Optional for cookie-based JWT sessions.
   */
  setJwtToken(token: string): void {
    if (this._config.auth.type !== 'jwt') {
      throw new BloqueConfigError('JWT token can only be set for JWT auth');
    }

    this._config.tokenStorage?.set(token);
    this._config.accessToken = token;
  }

  /**
   * Get JWT token from configured token storage, when provided.
   * @internal - Optional helper for sessions that persist tokens client-side.
   */
  getJwtToken(): string | null {
    if (this._config.auth.type !== 'jwt') {
      throw new BloqueConfigError('JWT token is only available for JWT auth');
    }

    return this._config.tokenStorage?.get() ?? null;
  }

  /**
   * Set the URN of the connected identity.
   * @internal - Called internally when connecting to a user session.
   */
  setUrn(urn: string): void {
    this._config.urn = urn;
  }

  /**
   * Set the origin identifier for the current session.
   * @internal - Called internally when origin is resolved after JWT authentication.
   */
  setOrigin(origin: string): void {
    this._config.origin = origin;
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

      if (!config.origin?.trim()) {
        throw new BloqueConfigError(
          'Origin is required for apiKey authentication',
        );
      }

      if (isFrontendPlatform(config.platform)) {
        throw new BloqueConfigError(
          'API key authentication is not allowed in frontend platforms',
        );
      }
    }

    if (config.auth.type === 'jwt') {
      if (config.platform !== 'browser' && !config.tokenStorage) {
        throw new BloqueConfigError(
          'tokenStorage must be provided when using JWT authentication outside browser platform',
        );
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
      if (this._config.platform === 'browser') {
        return {};
      }

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
    // Retry on rate limit, service unavailable, network errors, and timeouts
    if (
      error instanceof BloqueRateLimitError ||
      error instanceof BloqueNetworkError ||
      error instanceof BloqueTimeoutError
    ) {
      return true;
    }

    // Retry on 503 Service Unavailable
    if (error instanceof Error && 'status' in error && error.status === 503) {
      return true;
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
          credentials:
            this._config.auth.type === 'jwt' &&
            this._config.platform === 'browser'
              ? 'include'
              : undefined,
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

          // Extract metadata for error
          const requestId =
            response.headers.get('X-Request-ID') ??
            response.headers.get('Request-ID') ??
            undefined;

          const retryAfterHeader = response.headers.get('Retry-After');

          // Create appropriate error type
          const apiError =
            response.status === 429
              ? new BloqueRateLimitError(
                  errorData.message || 'Rate limit exceeded',
                  {
                    status: response.status,
                    code: errorData.code,
                    requestId,
                    response: responseData,
                    retryAfter: retryAfterHeader
                      ? Number.parseInt(retryAfterHeader, 10)
                      : undefined,
                  },
                )
              : createBloqueError(
                  errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`,
                  {
                    status: response.status,
                    code: errorData.code,
                    requestId,
                    response: responseData,
                  },
                );

          // Check if this error is retryable
          if (
            retryEnabled &&
            attempt < maxRetries &&
            this.isRetryableError(apiError)
          ) {
            lastError = apiError;
            const delay = this.calculateRetryDelay(
              attempt,
              retryAfterHeader ?? undefined,
            );
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
        // and it's not retryable
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          typeof error.name === 'string' &&
          error.name.startsWith('Bloque') &&
          !this.isRetryableError(error)
        ) {
          throw error;
        }

        let processedError: BloqueAPIError;

        // Handle AbortError (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          processedError = new BloqueTimeoutError(
            `Request timeout after ${effectiveTimeout}ms`,
            {
              timeoutMs: effectiveTimeout,
              cause: error,
            },
          );
        } else if (error instanceof Error) {
          processedError = new BloqueNetworkError(
            `Request failed: ${error.message}`,
            {
              cause: error,
            },
          );
        } else {
          processedError = createBloqueError('Unknown error occurred', {
            code: 'UNKNOWN_ERROR',
          });
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
      createBloqueError('Request failed after retries', {
        code: 'MAX_RETRIES_EXCEEDED',
      })
    );
  }
}
