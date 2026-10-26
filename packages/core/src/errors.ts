/**
 * Minimal shape of `HttpClient` that error classes need to make a follow-up
 * request (e.g. `BloqueVerificationRequiredError.getVerificationLink()`
 * calling a gate's `/start` endpoint). Declared structurally here instead of
 * importing `HttpClient` directly to avoid a circular import between
 * `errors.ts` and `http-client.ts` (the latter already imports from this
 * file to construct errors).
 */
export interface RequestCapableClient {
  request<T, U = unknown>(options: {
    method: string;
    path: string;
    body?: U;
    authorizationOverride?: string;
    _skipExchange?: boolean;
  }): Promise<T>;
}

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

  /** Seconds to wait before retrying, from the `Retry-After` header (429s only). */
  retryAfter?: number;

  /**
   * The `HttpClient` that produced this error, threaded through so error
   * classes like `BloqueVerificationRequiredError` can make an authenticated
   * follow-up call (e.g. starting a hosted gate flow) without the caller
   * having to pass their client back in.
   * @internal
   */
  httpClient?: RequestCapableClient;
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

function tierLimitMessage(extra?: TierLimitExtraDetails): string {
  if (!extra?.window) return "You've reached a usage limit.";
  const limit =
    extra.limit_usd_minor_units !== undefined
      ? ` of $${(Number(extra.limit_usd_minor_units) / 100).toFixed(2)}`
      : '';
  const resetHint = extra.reset_at ? ` Try again after ${extra.reset_at}.` : '';
  return `You've reached your ${extra.window} limit${limit}.${resetHint}`;
}

/**
 * Error thrown when the compliance engine blocks an action because it would
 * exceed the caller's tier limit for a given window
 * (`E_TIER_LIMIT_EXCEEDED`, HTTP 429) — distinct from the generic API rate
 * limit (`BloqueRateLimitError`), which is about request throughput, not
 * money-movement volume.
 */
export class BloqueTierLimitExceededError extends BloqueRateLimitError {
  /** The limit window that was exceeded (`per_transaction`, `day`, `week`, `month`, or `year`). */
  public readonly window: string;

  /** The specific window key that was exceeded (e.g. a calendar day/week/month/year key), when available. */
  public readonly windowKey?: string;

  /** ISO 8601 timestamp when this window resets, when available. */
  public readonly resetAt?: string;

  /** The window's limit, in USD minor units (cents), as a decimal string. */
  public readonly limitUsdMinorUnits?: string;

  /** USD minor units already consumed in this window, as a decimal string, when available. */
  public readonly consumedUsdMinorUnits?: string;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<TierLimitExtraDetails>(options?.response);
    super(tierLimitMessage(extra), options);
    this.name = 'BloqueTierLimitExceededError';
    this.window = extra?.window ?? 'unknown';
    this.windowKey = extra?.window_key;
    this.resetAt = extra?.reset_at;
    this.limitUsdMinorUnits = extra?.limit_usd_minor_units;
    this.consumedUsdMinorUnits = extra?.consumed_usd_minor_units;
    Object.setPrototypeOf(this, BloqueTierLimitExceededError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      window: this.window,
      windowKey: this.windowKey,
      resetAt: this.resetAt,
      limitUsdMinorUnits: this.limitUsdMinorUnits,
      consumedUsdMinorUnits: this.consumedUsdMinorUnits,
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
 * Machine-readable handoff describing which hosted gate a client should
 * open next to resolve a `BloqueVerificationRequiredError`. Mirrors the
 * compliance service's `VerificationFlowHandoff` (payment-rails
 * `domain/compliance.ts`) — only the two fields `getVerificationLink()`
 * actually needs are kept here.
 */
interface VerificationFlowExtraDetails {
  type?: 'tos_hosted_acceptance' | 'document_submission';
  method?: string;
  start_endpoint?: string;
}

interface VerificationRequiredExtraDetails {
  current_level?: number;
  required_level?: number;
  missing_requirements?: string[];
  /** Subset of `missing_requirements` already submitted and awaiting a
   * reviewer — present on both verification errors. */
  pending_requirements?: string[];
  verification_flow?: VerificationFlowExtraDetails;
}

interface TierLimitExtraDetails {
  window?: string;
  window_key?: string;
  reset_at?: string;
  limit_usd_minor_units?: string;
  consumed_usd_minor_units?: string;
}

function extractExtraDetails<T>(response: unknown): T | undefined {
  if (response && typeof response === 'object' && 'extra_details' in response) {
    return (response as { extra_details?: T }).extra_details;
  }
  return undefined;
}

function deriveVerificationReason(
  verificationFlow: VerificationFlowExtraDetails | undefined,
  missingRequirements: string[] | undefined,
): 'tos' | 'documents' | 'kyc' | 'unknown' {
  if (verificationFlow?.type === 'tos_hosted_acceptance') return 'tos';
  if (verificationFlow?.type === 'document_submission') return 'documents';
  // No hosted-gate handoff but requirements are still missing: the
  // compliance engine only omits `verification_flow` when every
  // outstanding requirement is KYC, which has no hosted-page flow of its
  // own (it's satisfied out-of-band by the provider callback).
  if (missingRequirements && missingRequirements.length > 0) return 'kyc';
  return 'unknown';
}

function verificationRequiredMessage(
  reason: 'tos' | 'documents' | 'kyc' | 'unknown',
  missingRequirements: string[] | undefined,
): string {
  switch (reason) {
    case 'tos':
      return 'Please accept the Terms of Service before continuing. Call getVerificationLink() to get a link your user can open.';
    case 'documents':
      return 'Additional information or documents are required before continuing. Call getVerificationLink() to get a link your user can open.';
    case 'kyc':
      return 'Identity verification (KYC) is required before continuing.';
    default:
      return missingRequirements?.length
        ? `Verification required: ${missingRequirements.join(', ')}.`
        : 'Verification required before continuing.';
  }
}

/**
 * Error thrown when the compliance engine blocks an action because the
 * caller's identity has not met the minimum verification tier
 * (`E_VERIFICATION_REQUIRED`, HTTP 403).
 *
 * `reason` tells you *what kind* of verification is outstanding, and
 * `getVerificationLink()` starts the matching hosted gate flow (TOS gate or
 * verification gate) so you don't need to hardcode either endpoint — it
 * reads `start_endpoint`/`method` from the same `verification_flow` handoff
 * the compliance engine returned.
 */
export class BloqueVerificationRequiredError extends BloqueAuthenticationError {
  /** What kind of verification is outstanding. `'kyc'` has no hosted-page
   * handoff — `getVerificationLink()` returns `null` for it. */
  public readonly reason: 'tos' | 'documents' | 'kyc' | 'unknown';

  /** The caller's current effective tier level. */
  public readonly currentLevel?: number;

  /** The minimum tier level required for the attempted action. */
  public readonly requiredLevel?: number;

  /** Requirement keys still outstanding at the caller's next tier level. */
  public readonly missingRequirements: string[];

  /**
   * The subset of `missingRequirements` your user has already submitted
   * and that is waiting on a reviewer. Do not ask for these again — the
   * rest of `missingRequirements` is what is actually actionable.
   */
  public readonly pendingRequirements: string[];

  private readonly verificationFlow?: VerificationFlowExtraDetails;
  private readonly requestClient?: RequestCapableClient;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<VerificationRequiredExtraDetails>(
      options?.response,
    );
    const missingRequirements = extra?.missing_requirements ?? [];
    const reason = deriveVerificationReason(
      extra?.verification_flow,
      missingRequirements,
    );
    super(verificationRequiredMessage(reason, missingRequirements), {
      ...options,
      code: options?.code ?? 'E_VERIFICATION_REQUIRED',
    });
    this.name = 'BloqueVerificationRequiredError';
    this.reason = reason;
    this.currentLevel = extra?.current_level;
    this.requiredLevel = extra?.required_level;
    this.missingRequirements = missingRequirements;
    this.pendingRequirements = extra?.pending_requirements ?? [];
    this.verificationFlow = extra?.verification_flow;
    this.requestClient = options?.httpClient;
    Object.setPrototypeOf(this, BloqueVerificationRequiredError.prototype);
  }

  /**
   * Starts the hosted gate flow this error points to (TOS gate or
   * verification gate) and returns the URL your user should open.
   *
   * Returns `null` when there is no hosted-page handoff for this gap
   * (`reason === 'kyc'`, or the response didn't include one).
   */
  async getVerificationLink(params: {
    returnUrl: string;
  }): Promise<{ url: string; expiresIn: string } | null> {
    if (!this.verificationFlow?.start_endpoint || !this.requestClient) {
      return null;
    }

    const result = await this.requestClient.request<{
      token: string;
      url: string;
      expires_in: string;
    }>({
      method: this.verificationFlow.method ?? 'POST',
      path: this.verificationFlow.start_endpoint,
      body: { return_url: params.returnUrl },
    });

    return { url: result.url, expiresIn: result.expires_in };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      reason: this.reason,
      currentLevel: this.currentLevel,
      requiredLevel: this.requiredLevel,
      missingRequirements: this.missingRequirements,
      pendingRequirements: this.pendingRequirements,
    };
  }
}

/**
 * Error thrown when the compliance engine blocks an action but your user
 * has *already submitted* everything it is waiting on
 * (`E_VERIFICATION_PENDING`, HTTP 403).
 *
 * The distinction from {@link BloqueVerificationRequiredError} matters in
 * your UI: there is deliberately no `getVerificationLink()` here, because
 * opening a gate would ask your user to re-send documents a reviewer is
 * already holding. Show them that the review is in progress and retry the
 * original action later — it succeeds once the review lands.
 */
export class BloqueVerificationPendingError extends BloqueAuthenticationError {
  /** The caller's current effective tier level. */
  public readonly currentLevel?: number;

  /** The minimum tier level required for the attempted action. */
  public readonly requiredLevel?: number;

  /** Requirement keys submitted and awaiting review. */
  public readonly pendingRequirements: string[];

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<VerificationRequiredExtraDetails>(
      options?.response,
    );
    const pendingRequirements = extra?.pending_requirements ?? [];
    super(
      'Your submission is being reviewed. No further action is needed right now — retry once the review is complete.',
      { ...options, code: options?.code ?? 'E_VERIFICATION_PENDING' },
    );
    this.name = 'BloqueVerificationPendingError';
    this.currentLevel = extra?.current_level;
    this.requiredLevel = extra?.required_level;
    this.pendingRequirements = pendingRequirements;
    Object.setPrototypeOf(this, BloqueVerificationPendingError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      currentLevel: this.currentLevel,
      requiredLevel: this.requiredLevel,
      pendingRequirements: this.pendingRequirements,
    };
  }
}

/** What the account owner approves: the operation and its exact money fields. */
export interface OperationApprovalSummary {
  /** Operation label, e.g. `accounts.transfer` or `swap.take`. */
  operation: string;
  /** The exact fields the approval covers (accounts, amounts, assets, ...). */
  fields: Record<string, unknown>;
}

interface ApprovalRequiredExtraDetails {
  approval_token?: string;
  approval_url?: string;
  /** Epoch ms. */
  expires_at?: number;
  summary?: OperationApprovalSummary;
}

interface ApprovalExtraDetails {
  reason?: string;
  message?: string;
  args?: string[];
}

type ApprovalResult =
  | { status: 'pending' }
  | { status: 'ready'; header: string; value: string }
  | { status: 'delivered' };

/**
 * A pending approval saved before sending the account owner away with a
 * full-page redirect, from `BloqueApprovalRequiredError.toPendingApproval()`.
 * Plain JSON, so it can go in `sessionStorage`. `approvalToken` and
 * `approvalUrl` only let you collect this one approval (the owner still signs
 * with their passkey), but treat them as secrets: never put them in a URL or
 * a log.
 */
export interface PendingApproval {
  /** Collects the approval through `/api/origins/operation-approvals/result`. */
  approvalToken: string;
  /** The approval page, to send the owner there again. */
  approvalUrl?: string;
  /** When the approval expires, in epoch milliseconds. */
  expiresAt: number;
  /** What the account owner is asked to approve. */
  summary?: OperationApprovalSummary;
}

/** One read of the approval's delivery state. @internal */
export function readApprovalResult(
  client: RequestCapableClient,
  approvalToken: string,
): Promise<ApprovalResult> {
  return client.request<ApprovalResult>({
    method: 'GET',
    path: '/api/origins/operation-approvals/result',
    authorizationOverride: `Bearer ${approvalToken}`,
    _skipExchange: true,
  });
}

function approvalTokenMissing(): BloqueApprovalExpiredError {
  return new BloqueApprovalExpiredError('', {
    code: 'E_APPROVAL_EXPIRED',
    response: { extra_details: { reason: 'approval_token_missing' } },
  });
}

/** Options for {@link BloqueApprovalRequiredError.waitForApproval}. */
export interface WaitForApprovalOptions {
  /** Delay between polls, in milliseconds. Never below 2000. @default 2000 */
  intervalMs?: number;
  /** Aborts the wait; the promise rejects with the signal's reason. */
  signal?: AbortSignal;
}

const MIN_APPROVAL_POLL_INTERVAL_MS = 2000;

const TIMED_OUT = Symbol('timed_out');

/**
 * Settles with `work`, or with `TIMED_OUT` after `ms`, or rejects with the
 * signal's reason on abort — whichever comes first. `work` is not cancelled;
 * it settles in the background. Without `work` it is an abortable sleep.
 */
function within<T = never>(
  work: Promise<T> | undefined,
  ms: number,
  signal?: AbortSignal,
): Promise<T | typeof TIMED_OUT> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const settle = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      settle();
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      settle();
      resolve(TIMED_OUT);
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
    work?.then(
      (value) => {
        settle();
        resolve(value);
      },
      (error) => {
        settle();
        reject(error);
      },
    );
  });
}

function stripUrlFragment(url: string | undefined): string | undefined {
  return url?.split('#')[0];
}

/**
 * Error thrown when a money-moving operation needs the account owner's
 * passkey approval (`E_APPROVAL_REQUIRED`, HTTP 428).
 *
 * Show `approvalUrl` to the account owner, wait for their signature with
 * `waitForApproval()`, then repeat the same call passing the returned value
 * as the `approval` option. `withApproval()` wraps the whole flow.
 */
export class BloqueApprovalRequiredError extends BloqueAPIError {
  /**
   * Hosted page where the account owner reviews and approves the operation.
   * It carries the approval token, so it is non-enumerable: readable, but
   * left out when the error is inspected, spread or serialized.
   */
  declare readonly approvalUrl?: string;

  /** When the approval expires. Repeat the operation before this time. */
  public readonly expiresAt: Date;

  /** What the account owner is asked to approve. */
  public readonly summary?: OperationApprovalSummary;

  // Non-enumerable so the token never shows up when the error is logged.
  private declare readonly approvalToken?: string;
  private declare readonly requestClient?: RequestCapableClient;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<ApprovalRequiredExtraDetails>(
      options?.response,
    );
    super(
      'This operation needs the account owner to approve it with their passkey. Share approvalUrl with them, then call waitForApproval() and repeat the same request with the approval.',
      {
        ...options,
        code: options?.code ?? 'E_APPROVAL_REQUIRED',
        response: redactApprovalResponse(options?.response),
      },
    );
    this.name = 'BloqueApprovalRequiredError';
    this.expiresAt = new Date(extra?.expires_at ?? Number.NaN);
    this.summary = extra?.summary;
    Object.defineProperties(this, {
      approvalUrl: { value: extra?.approval_url, enumerable: false },
      approvalToken: { value: extra?.approval_token, enumerable: false },
      requestClient: { value: options?.httpClient, enumerable: false },
    });
    Object.setPrototypeOf(this, BloqueApprovalRequiredError.prototype);
  }

  /**
   * Polls for the account owner's approval and resolves with the value to
   * pass as the `approval` option when repeating the operation.
   *
   * Stops at `expiresAt` (cutting a poll in flight), rejecting with
   * {@link BloqueApprovalExpiredError}. Its `reason` is
   * `approval_delivered_elsewhere` when the approval was collected by another
   * poll (e.g. a retried request whose `ready` response was lost): the owner
   * approved, but this call never received it.
   */
  async waitForApproval(options?: WaitForApprovalOptions): Promise<string> {
    if (!this.approvalToken || !this.requestClient) {
      throw approvalTokenMissing();
    }

    const requested = options?.intervalMs;
    const interval =
      requested !== undefined && Number.isFinite(requested)
        ? Math.max(requested, MIN_APPROVAL_POLL_INTERVAL_MS)
        : MIN_APPROVAL_POLL_INTERVAL_MS;
    const deadline = this.expiresAt.getTime();
    const signal = options?.signal;
    let delivered = false;

    while (Date.now() < deadline) {
      signal?.throwIfAborted();
      const result = await within(
        readApprovalResult(this.requestClient, this.approvalToken),
        deadline - Date.now(),
        signal,
      );
      if (result === TIMED_OUT) break;
      if (result.status === 'ready' && typeof result.value === 'string') {
        return result.value;
      }
      if (result.status === 'delivered') delivered = true;

      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await within(undefined, Math.min(interval, remaining), signal);
    }

    throw new BloqueApprovalExpiredError('', {
      code: 'E_APPROVAL_EXPIRED',
      response: {
        extra_details: {
          reason: delivered
            ? 'approval_delivered_elsewhere'
            : 'approval_not_received',
        },
      },
    });
  }

  /**
   * The approval to save before sending the account owner to `approvalUrl`
   * with a full-page redirect. When they come back, pass it to
   * `approvals.collect()` and repeat the same call with the approval.
   */
  toPendingApproval(): PendingApproval {
    if (!this.approvalToken) throw approvalTokenMissing();
    return {
      approvalToken: this.approvalToken,
      ...(this.approvalUrl && { approvalUrl: this.approvalUrl }),
      expiresAt: this.expiresAt.getTime(),
      ...(this.summary && { summary: this.summary }),
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      approvalUrl: stripUrlFragment(this.approvalUrl),
      expiresAt: Number.isNaN(this.expiresAt.getTime())
        ? undefined
        : this.expiresAt.toISOString(),
      summary: this.summary,
    };
  }
}

/** Drops the approval token (and the URL fragment carrying it) from a 428 body. */
function redactApprovalResponse(response: unknown): unknown {
  const extra = extractExtraDetails<ApprovalRequiredExtraDetails>(response);
  if (!extra) return response;
  const { approval_token: _token, ...rest } = extra;
  return {
    ...(response as object),
    extra_details: {
      ...rest,
      ...(rest.approval_url && {
        approval_url: stripUrlFragment(rest.approval_url),
      }),
    },
  };
}

function approvalInvalidMessage(extra?: ApprovalExtraDetails): string {
  switch (extra?.reason) {
    case 'passkey_rejected':
      return 'The passkey approval was refused or already used. Ask the account owner to open the approval link again and approve.';
    case 'passkey_not_registered':
      return (
        extra.message ??
        'This passkey is not registered for approvals. Register it again, then approve the operation.'
      );
    case 'operation_mismatch':
    case 'args_not_approved':
      return 'The request differs from the approved operation. Repeat the exact approved request, or request a new approval.';
    case 'passkey_not_owned_by_identity':
      return 'The passkey used to approve belongs to someone else. The account owner must approve with their own passkey.';
    default:
      return `The operation approval is not valid${extra?.reason ? ` (${extra.reason})` : ''}.`;
  }
}

/**
 * Error thrown by `approvals.collect()` when the account owner has not
 * approved yet (`E_APPROVAL_PENDING`), e.g. they came back without
 * approving. Send them to `approvalUrl` again before `expiresAt`, or call
 * `collect()` again later.
 */
export class BloqueApprovalPendingError extends BloqueAPIError {
  constructor(_message?: string, options?: BloqueAPIErrorOptions) {
    super('The account owner has not approved this operation yet.', {
      ...options,
      code: options?.code ?? 'E_APPROVAL_PENDING',
    });
    this.name = 'BloqueApprovalPendingError';
    Object.setPrototypeOf(this, BloqueApprovalPendingError.prototype);
  }
}

/**
 * Error thrown when an operation approval is refused (`E_APPROVAL_INVALID`,
 * HTTP 403). `reason` says why, e.g. `passkey_rejected` (ask the owner to
 * open the approval link again) or `passkey_not_registered` (the owner must
 * register their passkey again, then approve).
 */
export class BloqueApprovalInvalidError extends BloqueAPIError {
  /** Why the approval was refused (`extra_details.reason`). */
  public readonly reason?: string;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<ApprovalExtraDetails>(options?.response);
    super(approvalInvalidMessage(extra), {
      ...options,
      code: options?.code ?? 'E_APPROVAL_INVALID',
    });
    this.name = 'BloqueApprovalInvalidError';
    this.reason = extra?.reason;
    Object.setPrototypeOf(this, BloqueApprovalInvalidError.prototype);
  }

  toJSON() {
    return { ...super.toJSON(), reason: this.reason };
  }
}

/**
 * Error thrown when an operation approval expired (`E_APPROVAL_EXPIRED`), or
 * when `waitForApproval()` reached `expiresAt` without one. Repeat the
 * operation without an approval to get a new link.
 */
export class BloqueApprovalExpiredError extends BloqueAPIError {
  /** Why the approval expired (`extra_details.reason`), when given. */
  public readonly reason?: string;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<ApprovalExtraDetails>(options?.response);
    super(
      'The operation approval expired. Repeat the operation to request a new approval.',
      { ...options, code: options?.code ?? 'E_APPROVAL_EXPIRED' },
    );
    this.name = 'BloqueApprovalExpiredError';
    this.reason = extra?.reason;
    Object.setPrototypeOf(this, BloqueApprovalExpiredError.prototype);
  }

  toJSON() {
    return { ...super.toJSON(), reason: this.reason };
  }
}

/**
 * Error thrown when approvals cannot be issued or verified right now
 * (`E_APPROVAL_UNAVAILABLE`, HTTP 503). No money moved; retry later.
 */
export class BloqueApprovalUnavailableError extends BloqueAPIError {
  /** Why approvals are unavailable (`extra_details.reason`). */
  public readonly reason?: string;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<ApprovalExtraDetails>(options?.response);
    super('Operation approvals are unavailable right now. Retry later.', {
      ...options,
      code: options?.code ?? 'E_APPROVAL_UNAVAILABLE',
    });
    this.name = 'BloqueApprovalUnavailableError';
    this.reason = extra?.reason;
    Object.setPrototypeOf(this, BloqueApprovalUnavailableError.prototype);
  }

  toJSON() {
    return { ...super.toJSON(), reason: this.reason };
  }
}

/**
 * Error thrown when a swap order needs its first step's `args` to be approved
 * with it (`E_APPROVAL_ARGS_REQUIRED`, HTTP 422). Repeat the same call with
 * `args` set; `args` here names the missing ones.
 */
export class BloqueApprovalArgsRequiredError extends BloqueAPIError {
  /** Names of the first-step args the request must carry. */
  public readonly args: string[];

  /** `extra_details.reason`, e.g. `first_node_args_required`. */
  public readonly reason?: string;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<ApprovalExtraDetails>(options?.response);
    const args = extra?.args ?? [];
    super(
      `This order must carry its first step's args to be approved${args.length ? ` (${args.join(', ')})` : ''}. Repeat the request with args.`,
      { ...options, code: options?.code ?? 'E_APPROVAL_ARGS_REQUIRED' },
    );
    this.name = 'BloqueApprovalArgsRequiredError';
    this.args = args;
    this.reason = extra?.reason;
    Object.setPrototypeOf(this, BloqueApprovalArgsRequiredError.prototype);
  }

  toJSON() {
    return { ...super.toJSON(), args: this.args, reason: this.reason };
  }
}

/**
 * Error thrown when a batch debits accounts of more than one person who must
 * approve it (`E_APPROVAL_MULTIPLE_OWNERS`, HTTP 422). One approval covers
 * one owner: submit one batch per owner.
 */
export class BloqueApprovalMultipleOwnersError extends BloqueAPIError {
  /** `extra_details.reason`. */
  public readonly reason?: string;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<ApprovalExtraDetails>(options?.response);
    super(
      'This batch debits accounts of more than one person who must approve it. Submit one batch per account owner.',
      { ...options, code: options?.code ?? 'E_APPROVAL_MULTIPLE_OWNERS' },
    );
    this.name = 'BloqueApprovalMultipleOwnersError';
    this.reason = extra?.reason;
    Object.setPrototypeOf(this, BloqueApprovalMultipleOwnersError.prototype);
  }

  toJSON() {
    return { ...super.toJSON(), reason: this.reason };
  }
}

/**
 * Error thrown when a batch that needs an approval has accounts still being
 * created (`E_APPROVAL_ACCOUNTS_NOT_READY`, HTTP 422). Submit it again once
 * its accounts are ready.
 */
export class BloqueApprovalAccountsNotReadyError extends BloqueAPIError {
  /** `extra_details.reason`, e.g. `batch_has_accounts_in_creation`. */
  public readonly reason?: string;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<ApprovalExtraDetails>(options?.response);
    super(
      'Some accounts in this batch are still being created. Submit it again once they are ready.',
      { ...options, code: options?.code ?? 'E_APPROVAL_ACCOUNTS_NOT_READY' },
    );
    this.name = 'BloqueApprovalAccountsNotReadyError';
    this.reason = extra?.reason;
    Object.setPrototypeOf(this, BloqueApprovalAccountsNotReadyError.prototype);
  }

  toJSON() {
    return { ...super.toJSON(), reason: this.reason };
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
 * Error thrown when a `returnUrl` is refused (`E_RETURN_URL_NOT_ALLOWED`,
 * HTTP 400): it is not an https URL whose origin your origin allows, or your
 * origin allows none. Bloque sets the allowed origins on your origin.
 */
export class BloqueReturnUrlNotAllowedError extends BloqueValidationError {
  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    super(
      'returnUrl is not allowed: use an https URL whose origin your origin allows.',
      { ...options, code: options?.code ?? 'E_RETURN_URL_NOT_ALLOWED' },
    );
    this.name = 'BloqueReturnUrlNotAllowedError';
    Object.setPrototypeOf(this, BloqueReturnUrlNotAllowedError.prototype);
  }
}

/**
 * Error thrown when a passkey registration link cannot be created:
 * `E_PASSKEY_REGISTRATION_NOT_SUPPORTED` (HTTP 501, the deployment does not
 * register passkeys; retrying does not help) or
 * `E_PASSKEY_REGISTRATION_UNAVAILABLE` (HTTP 503, retry shortly).
 */
export class BloquePasskeyRegistrationUnavailableError extends BloqueAPIError {
  /** Whether retrying later can succeed (`extra_details.retryable`). */
  public readonly retryable: boolean;

  constructor(_message: string, options?: BloqueAPIErrorOptions) {
    const extra = extractExtraDetails<{ retryable?: boolean }>(
      options?.response,
    );
    const retryable =
      extra?.retryable ??
      options?.code !== 'E_PASSKEY_REGISTRATION_NOT_SUPPORTED';
    super(
      retryable
        ? 'Passkey registration is unavailable right now. Retry shortly.'
        : 'Passkey registration is not supported on this deployment.',
      options,
    );
    this.name = 'BloquePasskeyRegistrationUnavailableError';
    this.retryable = retryable;
    Object.setPrototypeOf(
      this,
      BloquePasskeyRegistrationUnavailableError.prototype,
    );
  }

  toJSON() {
    return { ...super.toJSON(), retryable: this.retryable };
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
  E_RETURN_URL_NOT_ALLOWED: BloqueReturnUrlNotAllowedError,
  E_PASSKEY_REGISTRATION_NOT_SUPPORTED:
    BloquePasskeyRegistrationUnavailableError,
  E_PASSKEY_REGISTRATION_UNAVAILABLE: BloquePasskeyRegistrationUnavailableError,
  // Add more mappings as we discover them from the API
};

/** Passkey operation-approval codes, mapped regardless of HTTP status. */
const APPROVAL_ERROR_MAP: Record<string, typeof BloqueAPIError> = {
  E_APPROVAL_REQUIRED: BloqueApprovalRequiredError,
  E_APPROVAL_INVALID: BloqueApprovalInvalidError,
  E_APPROVAL_EXPIRED: BloqueApprovalExpiredError,
  E_APPROVAL_UNAVAILABLE: BloqueApprovalUnavailableError,
  E_APPROVAL_ARGS_REQUIRED: BloqueApprovalArgsRequiredError,
  E_APPROVAL_MULTIPLE_OWNERS: BloqueApprovalMultipleOwnersError,
  E_APPROVAL_ACCOUNTS_NOT_READY: BloqueApprovalAccountsNotReadyError,
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

  // Compliance-gate codes need their own parsing (extra_details, the
  // optional httpClient for getVerificationLink()) rather than the plain
  // (message, options) construction ERROR_CODE_MAP assumes.
  if (code === 'E_VERIFICATION_REQUIRED') {
    return new BloqueVerificationRequiredError(message, options);
  }
  if (code === 'E_VERIFICATION_PENDING') {
    return new BloqueVerificationPendingError(message, options);
  }
  if (code === 'E_TIER_LIMIT_EXCEEDED') {
    return new BloqueTierLimitExceededError(message, options);
  }
  if (code && APPROVAL_ERROR_MAP[code]) {
    return new APPROVAL_ERROR_MAP[code](message, options);
  }

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
