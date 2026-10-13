import {
  BloqueApprovalRequiredError,
  type WaitForApprovalOptions,
} from './errors';

/** Request header carrying the account owner's passkey approval. */
export const OPERATION_APPROVAL_HEADER = 'x-bloque-operation-approval';

/** Options shared by every operation that may need a passkey approval. */
export interface OperationApprovalOptions {
  /**
   * The account owner's passkey approval, from
   * `BloqueApprovalRequiredError.waitForApproval()`. Pass it when repeating
   * the same call after a `BloqueApprovalRequiredError`.
   */
  approval?: string;
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

/** Headers for a gated request: `Idempotency-Key` and the approval, when set. */
export function operationApprovalHeaders(options?: {
  idempotencyKey?: string;
  approval?: string;
}): Record<string, string> {
  return {
    ...(options?.idempotencyKey && {
      'Idempotency-Key': options.idempotencyKey,
    }),
    ...(options?.approval && {
      [OPERATION_APPROVAL_HEADER]: options.approval,
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
