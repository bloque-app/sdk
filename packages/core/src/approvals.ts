import { BaseClient } from './base-client';
import {
  BloqueApprovalExpiredError,
  BloqueApprovalPendingError,
  BloqueApprovalRequiredError,
  type PendingApproval,
  readApprovalResult,
  type WaitForApprovalOptions,
} from './errors';

/** Request header carrying the account owner's passkey approval. */
export const OPERATION_APPROVAL_HEADER = 'x-bloque-operation-approval';

/** Request header naming where the approval page sends the owner back. */
export const OPERATION_APPROVAL_RETURN_URL_HEADER =
  'x-bloque-approval-return-url';

/** Options shared by every operation that may need a passkey approval. */
export interface OperationApprovalOptions {
  /**
   * The account owner's passkey approval, from
   * `BloqueApprovalRequiredError.waitForApproval()`. Pass it when repeating
   * the same call after a `BloqueApprovalRequiredError`.
   */
  approval?: string;
  /**
   * Where the approval page sends the account owner back once they approve,
   * when this call needs their approval. Must be an https URL whose origin
   * your origin allows; otherwise the call throws
   * `BloqueReturnUrlNotAllowedError`. Ignored when `approval` is set.
   */
  approvalReturnUrl?: string;
}

/** Options for {@link withApproval}. */
export interface WithApprovalOptions extends WaitForApprovalOptions {
  /**
   * Called when the operation needs the account owner's approval: share
   * `error.approvalUrl` with them. The wait starts once it resolves.
   */
  onApprovalRequired: (
    error: BloqueApprovalRequiredError,
  ) => void | Promise<void>;
}

/**
 * Headers for a gated request: `Idempotency-Key`, the approval and the
 * approval return URL, when set.
 */
export function operationApprovalHeaders(
  options?: OperationApprovalOptions & { idempotencyKey?: string },
): Record<string, string> {
  return {
    ...(options?.idempotencyKey && {
      'Idempotency-Key': options.idempotencyKey,
    }),
    ...(options?.approval && {
      [OPERATION_APPROVAL_HEADER]: options.approval,
    }),
    ...(!options?.approval &&
      options?.approvalReturnUrl && {
        [OPERATION_APPROVAL_RETURN_URL_HEADER]: options.approvalReturnUrl,
      }),
  };
}

/**
 * Runs an operation that may need the account owner's passkey approval.
 *
 * Calls `run()` once without an approval. On a `BloqueApprovalRequiredError`
 * it calls `onApprovalRequired`, waits for the approval and calls
 * `run(approval)` exactly once more; any error from that call (including a
 * second `BloqueApprovalRequiredError`) is thrown as is.
 *
 * @example
 * ```typescript
 * const transfer = await withApproval(
 *   (approval) => bloque.accounts.transfer(params, { approval }),
 *   { onApprovalRequired: (error) => notifyOwner(error.approvalUrl) },
 * );
 * ```
 */
export async function withApproval<T>(
  run: (approval?: string) => Promise<T>,
  options: WithApprovalOptions,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof BloqueApprovalRequiredError)) throw error;
    await options.onApprovalRequired(error);
    const approval = await error.waitForApproval({
      intervalMs: options.intervalMs,
      signal: options.signal,
    });
    return await run(approval);
  }
}

/**
 * Approvals collected after a full-page redirect: the account owner left
 * your page to approve on `approvalUrl` and came back to the
 * `approvalReturnUrl` the operation was called with.
 */
export class ApprovalsClient extends BaseClient {
  /**
   * Collects the approval saved with
   * `BloqueApprovalRequiredError.toPendingApproval()`, once. Repeat the same
   * call with it as the `approval` option right away: it must be used within
   * about two minutes of the owner opening the approval page, and only once.
   *
   * @throws {BloqueApprovalPendingError} The owner has not approved yet.
   * @throws {BloqueApprovalExpiredError} The approval expired
   * (`approval_not_received`) or was already collected
   * (`approval_delivered_elsewhere`).
   *
   * @example
   * ```typescript
   * // Before the redirect
   * sessionStorage.setItem('transfer', JSON.stringify({
   *   params,
   *   pending: error.toPendingApproval(),
   * }));
   * window.location.assign(error.approvalUrl);
   *
   * // Back on approvalReturnUrl
   * const { params, pending } = JSON.parse(sessionStorage.getItem('transfer'));
   * sessionStorage.removeItem('transfer');
   * const approval = await bloque.approvals.collect(pending);
   * await bloque.accounts.transfer(params, { approval });
   * ```
   */
  async collect(pending: PendingApproval): Promise<string> {
    if (!(Date.now() < pending.expiresAt)) {
      throw new BloqueApprovalExpiredError('', {
        code: 'E_APPROVAL_EXPIRED',
        response: { extra_details: { reason: 'approval_not_received' } },
      });
    }
    const result = await readApprovalResult(
      this.httpClient,
      pending.approvalToken,
    );
    if (result.status === 'ready' && typeof result.value === 'string') {
      return result.value;
    }
    if (result.status === 'delivered') {
      throw new BloqueApprovalExpiredError('', {
        code: 'E_APPROVAL_EXPIRED',
        response: {
          extra_details: { reason: 'approval_delivered_elsewhere' },
        },
      });
    }
    throw new BloqueApprovalPendingError();
  }
}
