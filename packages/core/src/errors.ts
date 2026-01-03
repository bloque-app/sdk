/**
 * Options for creating a BloqueAPIError.
 */
export interface BloqueAPIErrorOptions {
  /** HTTP status code (e.g., 400, 401, 500) */
  status?: number;

  /** Error code from the API (e.g., 'INVALID_ALIAS', 'INSUFFICIENT_FUNDS') */
  code?: string;

  /** Request ID for tracing (from response headers) */
  requestId?: string;

  /** Original response body for debugging */
  response?: unknown;

  /** Cause of the error (e.g., network error, parse error) */
  cause?: Error;
}

/**
 * Base error class for all Bloque API errors.
 *
 * This error is thrown when the API returns an error response
 * or when a network/timeout error occurs during a request.
 */
export class BloqueAPIError extends Error {
  /** HTTP status code (e.g., 400, 401, 500) */
  public readonly status?: number;

  /** Error code from the API (e.g., 'INVALID_ALIAS', 'INSUFFICIENT_FUNDS') */
  public readonly code?: string;

  /** Request ID for tracing (from response headers) */
  public readonly requestId?: string;

  /** Timestamp when the error occurred */
  public readonly timestamp: Date;

  /** Original response body for debugging */
  public readonly response?: unknown;

  /** Cause of the error (e.g., network error, parse error) */
  public readonly cause?: Error;

  constructor(message: string, options?: BloqueAPIErrorOptions) {
    super(message);
    this.name = 'BloqueAPIError';
    this.status = options?.status;
    this.code = options?.code;
    this.requestId = options?.requestId;
    this.response = options?.response;
    this.cause = options?.cause;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, BloqueAPIError.prototype);
  }

  /**
   * Returns a JSON representation of the error.
   * Useful for logging and debugging.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      requestId: this.requestId,
      timestamp: this.timestamp.toISOString(),
      response: this.response,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when the API rate limit is exceeded (HTTP 429).
 *
 * The SDK will automatically retry these requests if retry is enabled.
 * Check the `retryAfter` field to know when to retry manually if needed.
 */
export class BloqueRateLimitError extends BloqueAPIError {
  /** Number of seconds to wait before retrying (from Retry-After header) */
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options?: BloqueAPIErrorOptions & { retryAfter?: number },
  ) {
    super(message, { ...options, status: 429 });
    this.name = 'BloqueRateLimitError';
    this.retryAfter = options?.retryAfter;
    Object.setPrototypeOf(this, BloqueRateLimitError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Error thrown when authentication fails (HTTP 401 or 403).
 *
 * Possible causes:
 * - Invalid or expired API key
 * - Invalid or expired JWT token
 * - Insufficient permissions for the requested operation
 */
export class BloqueAuthenticationError extends BloqueAPIError {
  constructor(message: string, options?: BloqueAPIErrorOptions) {
    super(message, options);
    this.name = 'BloqueAuthenticationError';
    Object.setPrototypeOf(this, BloqueAuthenticationError.prototype);
  }
}

/**
 * Error thrown when request validation fails (HTTP 400).
 *
 * Possible causes:
 * - Missing required fields
 * - Invalid field format
 * - Invalid field values
 * - Business rule validation failures
 */
export class BloqueValidationError extends BloqueAPIError {
  /** Validation errors by field (if provided by API) */
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    options?: BloqueAPIErrorOptions & {
      validationErrors?: Record<string, string[]>;
    },
  ) {
    super(message, { ...options, status: 400 });
    this.name = 'BloqueValidationError';
    this.validationErrors = options?.validationErrors;
    Object.setPrototypeOf(this, BloqueValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Error thrown when a resource is not found (HTTP 404).
 *
 * Possible causes:
 * - Invalid resource ID
 * - Resource was deleted
 * - User doesn't have access to the resource
 */
export class BloqueNotFoundError extends BloqueAPIError {
  /** Type of resource that was not found (e.g., 'identity', 'account') */
  public readonly resourceType?: string;

  /** ID of the resource that was not found */
  public readonly resourceId?: string;

  constructor(
    message: string,
    options?: BloqueAPIErrorOptions & {
      resourceType?: string;
      resourceId?: string;
    },
  ) {
    super(message, { ...options, status: 404 });
    this.name = 'BloqueNotFoundError';
    this.resourceType = options?.resourceType;
    this.resourceId = options?.resourceId;
    Object.setPrototypeOf(this, BloqueNotFoundError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
  }
}

/**
 * Error thrown when an operation requires more funds than available.
 *
 * This is a domain-specific error for financial operations.
 */
export class BloqueInsufficientFundsError extends BloqueAPIError {
  /** Amount requested for the operation */
  public readonly requestedAmount?: number;

  /** Available balance */
  public readonly availableBalance?: number;

  /** Currency code (e.g., 'USD', 'CLP') */
  public readonly currency?: string;

  constructor(
    message: string,
    options?: BloqueAPIErrorOptions & {
      requestedAmount?: number;
      availableBalance?: number;
      currency?: string;
    },
  ) {
    super(message, options);
    this.name = 'BloqueInsufficientFundsError';
    this.requestedAmount = options?.requestedAmount;
    this.availableBalance = options?.availableBalance;
    this.currency = options?.currency;
    Object.setPrototypeOf(this, BloqueInsufficientFundsError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      requestedAmount: this.requestedAmount,
      availableBalance: this.availableBalance,
      currency: this.currency,
    };
  }
}

/**
 * Error thrown when a network error occurs.
 *
 * Possible causes:
 * - No internet connection
 * - DNS resolution failure
 * - Connection refused
 * - SSL/TLS errors
 */
export class BloqueNetworkError extends BloqueAPIError {
  constructor(message: string, options?: BloqueAPIErrorOptions) {
    super(message, { ...options, code: options?.code ?? 'NETWORK_ERROR' });
    this.name = 'BloqueNetworkError';
    Object.setPrototypeOf(this, BloqueNetworkError.prototype);
  }
}

/**
 * Error thrown when a request times out.
 *
 * The request exceeded the configured timeout duration.
 * The SDK will automatically retry if retry is enabled.
 */
export class BloqueTimeoutError extends BloqueAPIError {
  /** Timeout duration in milliseconds */
  public readonly timeoutMs: number;

  constructor(
    message: string,
    options?: BloqueAPIErrorOptions & { timeoutMs: number },
  ) {
    super(message, { ...options, code: 'TIMEOUT_ERROR' });
    this.name = 'BloqueTimeoutError';
    this.timeoutMs = options?.timeoutMs ?? 0;
    Object.setPrototypeOf(this, BloqueTimeoutError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
    };
  }
}

/**
 * Error thrown when the SDK is misconfigured.
 *
 * This error is thrown before making any API requests.
 */
export class BloqueConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BloqueConfigError';
    Object.setPrototypeOf(this, BloqueConfigError.prototype);
  }
}

/**
 * Known API error codes that map to specific error types.
 */
const ERROR_CODE_MAP: Record<
  string,
  typeof BloqueAPIError | typeof BloqueInsufficientFundsError
> = {
  INSUFFICIENT_FUNDS: BloqueInsufficientFundsError,
  INSUFFICIENT_BALANCE: BloqueInsufficientFundsError,
  // Add more mappings as we discover them from the API
};

/**
 * Factory function to create the appropriate error type based on status code and error code.
 *
 * @internal
 */
export function createBloqueError(
  message: string,
  options?: BloqueAPIErrorOptions,
): BloqueAPIError {
  const { status, code } = options ?? {};

  // Check for specific error codes first
  if (code && ERROR_CODE_MAP[code]) {
    return new ERROR_CODE_MAP[code](message, options);
  }

  // Map by HTTP status code
  switch (status) {
    case 400:
      return new BloqueValidationError(message, options);
    case 401:
    case 403:
      return new BloqueAuthenticationError(message, options);
    case 404:
      return new BloqueNotFoundError(message, options);
    case 429:
      return new BloqueRateLimitError(message, options);
    default:
      return new BloqueAPIError(message, options);
  }
}
