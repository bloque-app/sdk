import { randomUUID } from 'node:crypto';
import {
  BloqueApprovalExpiredError,
  BloqueApprovalInvalidError,
  BloqueApprovalRequiredError,
  type OperationApprovalSummary,
} from '@bloque/sdk';

/**
 * Runs a money-moving call that may need the account owner's passkey
 * approval. Called once without an approval and, after the owner approves,
 * once more with it. It must send the exact same request both times (same
 * body, same `Idempotency-Key`), or the server refuses the approval.
 */
export type GatedOperation<T> = (approval?: string) => Promise<T>;

/** What a caller needs to get an operation approved. */
export interface PendingApprovalInfo {
  /** Handle to check or resume the operation later. */
  approvalId: string;
  /** What is waiting for approval, in plain words. */
  operation: string;
  /**
   * Page where the account owner approves with their passkey. Share it with
   * them only: it carries the approval token.
   */
  approvalUrl?: string;
  /** ISO time after which the approval can no longer be given. */
  expiresAt?: string;
  /** The operation and the exact money fields the owner is asked to approve. */
  summary?: OperationApprovalSummary;
}

export type ApprovalOutcome<T> =
  /** The operation ran (with or without an approval). */
  | { status: 'completed'; result: T }
  /** Waiting for the owner. Nothing moved yet; it can still be resumed. */
  | ({ status: 'approval_required' } & PendingApprovalInfo)
  /** No approval arrived before it expired. Nothing moved. */
  | {
      status: 'approval_expired';
      operation: string;
      reason?: string;
      message: string;
    }
  /** The server refused the approval (e.g. passkey rejected). Nothing moved. */
  | {
      status: 'approval_rejected';
      operation: string;
      reason?: string;
      message: string;
    }
  /** No pending approval with that id: unknown, finished or expired. */
  | { status: 'approval_not_found'; approvalId: string; message: string };

export interface ApprovalWaitOptions {
  /**
   * How long to wait for the owner's approval in this call, in milliseconds.
   * `0` returns `approval_required` straight away. The operation stays
   * resumable after the wait ends.
   */
  waitMs?: number;
  /** Poll interval. The SDK never polls faster than every 2 s. */
  intervalMs?: number;
  /** Stops waiting (the operation stays resumable). */
  signal?: AbortSignal;
  /**
   * Called once the operation is known to need approval, before waiting:
   * the moment to show the approval link to the owner.
   */
  onApprovalRequired?: (pending: PendingApprovalInfo) => void | Promise<void>;
}

interface PendingEntry {
  id: string;
  operation: string;
  error: BloqueApprovalRequiredError;
  run: GatedOperation<unknown>;
  inFlight?: Promise<ApprovalOutcome<unknown>>;
}

/**
 * Turns the SDK's passkey approval flow into plain outcomes, and keeps the
 * operations that are still waiting so they can be resumed by id.
 *
 * One gate is shared by every money-moving call in the CLI, so the approval
 * behavior (wait, time out, expire, reject, resume) is the same everywhere.
 */
export class ApprovalGate {
  private readonly pending = new Map<string, PendingEntry>();

  /**
   * Runs `run()`. If the server asks for the owner's approval, registers the
   * operation, calls `onApprovalRequired`, waits up to `waitMs` and, once
   * approved, runs it again with the approval.
   *
   * Errors other than the approval ones are thrown as they are.
   */
  async run<T>(
    operation: string,
    run: GatedOperation<T>,
    options: ApprovalWaitOptions = {},
  ): Promise<ApprovalOutcome<T>> {
    let error: BloqueApprovalRequiredError;
    try {
      return { status: 'completed', result: await run() };
    } catch (err) {
      if (!(err instanceof BloqueApprovalRequiredError)) throw err;
      error = err;
    }

    const entry = this.register(operation, error, run);
    await options.onApprovalRequired?.(this.info(entry));
    return (await this.settle(entry, options)) as ApprovalOutcome<T>;
  }

  /**
   * Waits up to `waitMs` for a pending operation's approval and runs it once
   * approved. Resuming an id that is already being waited on joins that wait.
   */
  async resume(
    approvalId: string,
    options: Omit<ApprovalWaitOptions, 'onApprovalRequired'> = {},
  ): Promise<ApprovalOutcome<unknown>> {
    const entry = this.pending.get(approvalId);
    if (!entry) {
      return {
        status: 'approval_not_found',
        approvalId,
        message:
          'No pending approval with this id. It already finished, expired, or belongs to another session. Repeat the operation to request a new approval.',
      };
    }
    return await this.settle(entry, options);
  }

  /** Operations still waiting for approval. */
  list(): PendingApprovalInfo[] {
    this.prune();
    return [...this.pending.values()].map((entry) => this.info(entry));
  }

  private settle(
    entry: PendingEntry,
    options: ApprovalWaitOptions,
  ): Promise<ApprovalOutcome<unknown>> {
    if (!options.waitMs || options.waitMs <= 0) {
      return Promise.resolve(this.pendingOutcome(entry));
    }
    if (!entry.inFlight) {
      entry.inFlight = this.waitAndRun(entry, options).finally(() => {
        entry.inFlight = undefined;
      });
    }
    return entry.inFlight;
  }

  private async waitAndRun(
    entry: PendingEntry,
    options: ApprovalWaitOptions,
  ): Promise<ApprovalOutcome<unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.waitMs);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort, { once: true });
    if (options.signal?.aborted) controller.abort();

    let approval: string;
    try {
      approval = await entry.error.waitForApproval({
        intervalMs: options.intervalMs,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof BloqueApprovalExpiredError) {
        this.pending.delete(entry.id);
        return {
          status: 'approval_expired',
          operation: entry.operation,
          reason: err.reason,
          message: err.message,
        };
      }
      // Our own time limit, or the caller gave up: still resumable.
      if (controller.signal.aborted) return this.pendingOutcome(entry);
      throw err;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
    }

    // The approval is single-use: whatever happens next, this entry is done.
    this.pending.delete(entry.id);
    try {
      return { status: 'completed', result: await entry.run(approval) };
    } catch (err) {
      if (err instanceof BloqueApprovalInvalidError) {
        return {
          status: 'approval_rejected',
          operation: entry.operation,
          reason: err.reason,
          message: err.message,
        };
      }
      if (err instanceof BloqueApprovalExpiredError) {
        return {
          status: 'approval_expired',
          operation: entry.operation,
          reason: err.reason,
          message: err.message,
        };
      }
      if (err instanceof BloqueApprovalRequiredError) {
        // The server wants a fresh approval: start over with the new link.
        return this.pendingOutcome(
          this.register(entry.operation, err, entry.run),
        );
      }
      throw err;
    }
  }

  private register(
    operation: string,
    error: BloqueApprovalRequiredError,
    run: GatedOperation<unknown>,
  ): PendingEntry {
    this.prune();
    const entry: PendingEntry = {
      id: `apr_${randomUUID()}`,
      operation,
      error,
      run,
    };
    this.pending.set(entry.id, entry);
    return entry;
  }

  /** Drops entries past their expiry that nobody is waiting on. */
  private prune(): void {
    const now = Date.now();
    for (const [id, entry] of this.pending) {
      if (!entry.inFlight && entry.error.expiresAt.getTime() <= now) {
        this.pending.delete(id);
      }
    }
  }

  private info(entry: PendingEntry): PendingApprovalInfo {
    const expiresAt = entry.error.expiresAt;
    return {
      approvalId: entry.id,
      operation: entry.operation,
      approvalUrl: entry.error.approvalUrl,
      expiresAt: Number.isNaN(expiresAt.getTime())
        ? undefined
        : expiresAt.toISOString(),
      summary: entry.error.summary,
    };
  }

  private pendingOutcome(entry: PendingEntry): ApprovalOutcome<never> {
    return { status: 'approval_required', ...this.info(entry) };
  }
}
