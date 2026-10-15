import { randomUUID } from 'node:crypto';
import {
  BloqueAPIError,
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
  /**
   * The owner approved and the approved request is being sent right now.
   * Check again for its result; never repeat the operation.
   */
  | {
      status: 'in_progress';
      approvalId: string;
      operation: string;
      message: string;
    }
  /** No approval arrived before it expired. Nothing moved. */
  | {
      status: 'approval_expired';
      operation: string;
      reason?: string;
      message: string;
      repeatWith?: string;
    }
  /** The server refused the approval (e.g. passkey rejected). Nothing moved. */
  | {
      status: 'approval_rejected';
      operation: string;
      reason?: string;
      message: string;
      repeatWith?: string;
    }
  /**
   * The approved request was sent but did not return a result: it failed,
   * or its reply was lost. It may or may not have moved money.
   */
  | {
      status: 'failed';
      approvalId: string;
      operation: string;
      code?: string;
      message: string;
    }
  /** No approval with that id in this session. */
  | { status: 'approval_not_found'; approvalId: string; message: string };

type FinalOutcome = Extract<
  ApprovalOutcome<unknown>,
  { status: 'completed' | 'approval_expired' | 'approval_rejected' }
>;

export interface ApprovalWaitOptions {
  /**
   * How long to wait in this call, in milliseconds: for the owner's approval
   * and then for the approved request. `0` answers with the current state
   * straight away. The operation is kept either way.
   */
  waitMs?: number;
  /** Poll interval. The SDK never polls faster than every 2 s. */
  intervalMs?: number;
  /**
   * Stops waiting. The operation is kept: an approval not given yet can
   * still be resumed, and an approved request already sent still finishes
   * and keeps its result.
   */
  signal?: AbortSignal;
  /**
   * Called once the operation is known to need approval, before waiting:
   * the moment to show the approval link to the owner.
   */
  onApprovalRequired?: (pending: PendingApprovalInfo) => void | Promise<void>;
}

export interface ApprovalRunOptions extends ApprovalWaitOptions {
  /**
   * What to repeat, in plain words, if the approval expires or is rejected,
   * when that is not the whole original call (e.g. a workflow that already
   * created a card and only needs its funding step repeated).
   */
  repeatWith?: string;
}

/** A finished entry is kept at least this long, so a re-check finds it. */
export const SETTLED_MIN_RETENTION_MS = 15 * 60_000;
/** ...and never longer than this, whatever the approval's expiry. */
export const SETTLED_MAX_RETENTION_MS = 60 * 60_000;
/** At most this many finished entries are kept; the oldest go first. */
export const SETTLED_MAX_ENTRIES = 500;

interface Poll {
  promise: Promise<void>;
  controller: AbortController;
  waiters: number;
}

/**
 * - `pending`: waiting for the owner's approval.
 * - `running`: approved; the approved request is in flight.
 * - `completed`: finished with a final outcome (ran, expired or rejected).
 * - `failed`: the approved request threw; kept so it is never sent again.
 */
type EntryState =
  | { kind: 'pending'; poll?: Poll }
  | { kind: 'running'; done: Promise<void> }
  | { kind: 'completed'; outcome: FinalOutcome; retainUntil: number }
  | { kind: 'failed'; error: unknown; retainUntil: number };

interface Entry {
  id: string;
  operation: string;
  repeatWith?: string;
  /** The current approval request (renewed if the server asks again). */
  request: BloqueApprovalRequiredError;
  run: GatedOperation<unknown>;
  state: EntryState;
}

/**
 * Turns the SDK's passkey approval flow into plain outcomes, and keeps every
 * gated operation by id so it can be resumed, and so its approved request is
 * sent at most once.
 *
 * One gate is shared by every money-moving call in the CLI, so the approval
 * behavior (wait, time out, expire, reject, resume) is the same everywhere.
 */
export class ApprovalGate {
  private readonly entries = new Map<string, Entry>();

  /**
   * Runs `run()`. If the server asks for the owner's approval, registers the
   * operation, calls `onApprovalRequired`, waits up to `waitMs` and, once
   * approved, runs it again with the approval.
   *
   * Errors from the first call, other than the approval request, are thrown
   * as they are. After an approval, errors become a `failed` outcome.
   */
  async run<T>(
    operation: string,
    run: GatedOperation<T>,
    options: ApprovalRunOptions = {},
  ): Promise<ApprovalOutcome<T>> {
    let request: BloqueApprovalRequiredError;
    try {
      return { status: 'completed', result: await run() };
    } catch (err) {
      if (!(err instanceof BloqueApprovalRequiredError)) throw err;
      request = err;
    }

    const entry = this.register(operation, request, run, options.repeatWith);
    await options.onApprovalRequired?.(this.info(entry));
    return (await this.settle(entry, options)) as ApprovalOutcome<T>;
  }

  /**
   * Checks an operation by id, waiting up to `waitMs` for its approval or
   * its approved request. Never sends the approved request twice: a check
   * while it is in flight waits for it, and a check after it finished gets
   * the result it already had.
   */
  async resume(
    approvalId: string,
    options: Omit<ApprovalWaitOptions, 'onApprovalRequired'> = {},
  ): Promise<ApprovalOutcome<unknown>> {
    this.prune();
    const entry = this.entries.get(approvalId);
    if (!entry) {
      return {
        status: 'approval_not_found',
        approvalId,
        message:
          'No approval with this id in this session: it is unknown, belongs to another session, or finished too long ago to be kept.',
      };
    }
    return await this.settle(entry, options);
  }

  /** Operations still waiting for the owner's approval. */
  list(): PendingApprovalInfo[] {
    this.prune();
    return [...this.entries.values()]
      .filter((entry) => entry.state.kind === 'pending')
      .map((entry) => this.info(entry));
  }

  private async settle(
    entry: Entry,
    options: ApprovalWaitOptions,
  ): Promise<ApprovalOutcome<unknown>> {
    const deadline = Date.now() + Math.max(0, options.waitMs ?? 0);
    const request = entry.request;
    const stop = () =>
      Date.now() >= deadline || options.signal?.aborted === true;

    for (;;) {
      const state = entry.state;
      switch (state.kind) {
        case 'completed':
          return state.outcome;
        case 'failed':
          return this.failedOutcome(entry, state.error);
        case 'running':
          if (stop()) return this.inProgressOutcome(entry);
          await until(state.done, deadline, options.signal);
          break;
        case 'pending': {
          // The approved repeat asked for a new approval: show the new link.
          if (entry.request !== request || stop()) {
            return this.pendingOutcome(entry);
          }
          const poll = this.joinPoll(entry, state, options.intervalMs);
          try {
            await until(poll.promise, deadline, options.signal);
          } finally {
            this.leavePoll(entry, poll);
          }
          break;
        }
      }
    }
  }

  /** One poll per approval, shared by every caller waiting on it. */
  private joinPoll(
    entry: Entry,
    state: Extract<EntryState, { kind: 'pending' }>,
    intervalMs?: number,
  ): Poll {
    if (!state.poll) state.poll = this.startPoll(entry, intervalMs);
    state.poll.waiters++;
    return state.poll;
  }

  /** Stops polling once nobody waits; the entry stays pending. */
  private leavePoll(entry: Entry, poll: Poll): void {
    poll.waiters--;
    if (poll.waiters > 0) return;
    poll.controller.abort();
    if (entry.state.kind === 'pending' && entry.state.poll === poll) {
      entry.state.poll = undefined;
    }
  }

  private startPoll(entry: Entry, intervalMs?: number): Poll {
    const controller = new AbortController();
    const request = entry.request;
    const isCurrent = () =>
      entry.state.kind === 'pending' && entry.request === request;
    const promise = (async () => {
      let approval: string;
      try {
        approval = await request.waitForApproval({
          intervalMs,
          signal: controller.signal,
        });
      } catch (err) {
        if (!isCurrent()) return;
        if (err instanceof BloqueApprovalExpiredError) {
          this.finish(entry, this.expiredOutcome(entry, err));
          return;
        }
        // Nobody is waiting any more: still pending, still resumable.
        if (controller.signal.aborted) return;
        throw err;
      }
      if (isCurrent()) this.execute(entry, approval);
    })();
    // Waiters see the rejection; this only keeps it from being unhandled.
    promise.catch(() => {});
    return { promise, controller, waiters: 0 };
  }

  /**
   * Sends the approved request. It runs to the end whoever is waiting, and
   * its result is kept on the entry, so it is sent once.
   */
  private execute(entry: Entry, approval: string): void {
    const done = (async () => {
      try {
        const result = await entry.run(approval);
        this.finish(entry, { status: 'completed', result });
      } catch (err) {
        if (err instanceof BloqueApprovalInvalidError) {
          this.finish(entry, {
            status: 'approval_rejected',
            operation: entry.operation,
            reason: err.reason,
            message: err.message,
            repeatWith: entry.repeatWith,
          });
        } else if (err instanceof BloqueApprovalExpiredError) {
          this.finish(entry, this.expiredOutcome(entry, err));
        } else if (err instanceof BloqueApprovalRequiredError) {
          // The server wants a fresh approval: same id, new link.
          entry.request = err;
          entry.state = { kind: 'pending' };
        } else {
          entry.state = {
            kind: 'failed',
            error: err,
            retainUntil: this.retainUntil(entry),
          };
          this.capSettled();
        }
      }
    })();
    // Set before the request settles: the body above only gets past its
    // first `await` after this line.
    entry.state = { kind: 'running', done };
  }

  private finish(entry: Entry, outcome: FinalOutcome): void {
    entry.state = {
      kind: 'completed',
      outcome,
      retainUntil: this.retainUntil(entry),
    };
    this.capSettled();
  }

  /** Until the approval's expiry, within the retention bounds. */
  private retainUntil(entry: Entry): number {
    const now = Date.now();
    const expiresAt = entry.request.expiresAt.getTime();
    const wanted = Number.isNaN(expiresAt) ? now : expiresAt;
    return Math.min(
      Math.max(wanted, now + SETTLED_MIN_RETENTION_MS),
      now + SETTLED_MAX_RETENTION_MS,
    );
  }

  private register(
    operation: string,
    request: BloqueApprovalRequiredError,
    run: GatedOperation<unknown>,
    repeatWith?: string,
  ): Entry {
    this.prune();
    const entry: Entry = {
      id: `apr_${randomUUID()}`,
      operation,
      repeatWith,
      request,
      run,
      state: { kind: 'pending' },
    };
    this.entries.set(entry.id, entry);
    return entry;
  }

  /**
   * Expires pending entries past their expiry that nobody is waiting on
   * (they never ran, so nothing moved), and drops finished entries past
   * their retention.
   */
  private prune(): void {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      const state = entry.state;
      if (state.kind === 'pending') {
        if (!state.poll && entry.request.expiresAt.getTime() <= now) {
          this.finish(entry, {
            status: 'approval_expired',
            operation: entry.operation,
            reason: 'approval_not_received',
            message:
              'The operation approval expired. Repeat the operation to request a new approval.',
            repeatWith: entry.repeatWith,
          });
        }
      } else if (
        (state.kind === 'completed' || state.kind === 'failed') &&
        state.retainUntil <= now
      ) {
        this.entries.delete(id);
      }
    }
  }

  private capSettled(): void {
    const settled = [...this.entries.values()].filter(
      (entry) =>
        entry.state.kind === 'completed' || entry.state.kind === 'failed',
    );
    // Map order is insertion order: the first ones are the oldest.
    for (const entry of settled.slice(
      0,
      Math.max(0, settled.length - SETTLED_MAX_ENTRIES),
    )) {
      this.entries.delete(entry.id);
    }
  }

  private info(entry: Entry): PendingApprovalInfo {
    const expiresAt = entry.request.expiresAt;
    return {
      approvalId: entry.id,
      operation: entry.operation,
      approvalUrl: entry.request.approvalUrl,
      expiresAt: Number.isNaN(expiresAt.getTime())
        ? undefined
        : expiresAt.toISOString(),
      summary: entry.request.summary,
    };
  }

  private pendingOutcome(entry: Entry): ApprovalOutcome<never> {
    return { status: 'approval_required', ...this.info(entry) };
  }

  private inProgressOutcome(entry: Entry): ApprovalOutcome<never> {
    return {
      status: 'in_progress',
      approvalId: entry.id,
      operation: entry.operation,
      message:
        'The owner approved and the approved request is being sent. Its result is kept under this approvalId.',
    };
  }

  private failedOutcome(entry: Entry, error: unknown): ApprovalOutcome<never> {
    return {
      status: 'failed',
      approvalId: entry.id,
      operation: entry.operation,
      code: error instanceof BloqueAPIError ? error.code : undefined,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  private expiredOutcome(
    entry: Entry,
    err: BloqueApprovalExpiredError,
  ): FinalOutcome {
    return {
      status: 'approval_expired',
      operation: entry.operation,
      reason: err.reason,
      message: err.message,
      repeatWith: entry.repeatWith,
    };
  }
}

/**
 * Waits for `promise`, but no later than `deadline` or `signal`. Rejects
 * when `promise` does; resolves either way otherwise.
 */
async function until(
  promise: Promise<unknown>,
  deadline: number,
  signal?: AbortSignal,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const stopped = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, Math.max(0, deadline - Date.now()));
    onAbort = () => resolve();
    signal?.addEventListener('abort', onAbort, { once: true });
  });
  try {
    await Promise.race([promise, stopped]);
  } finally {
    clearTimeout(timer);
    if (onAbort) signal?.removeEventListener('abort', onAbort);
  }
}
