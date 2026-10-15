import { afterEach, describe, expect, it, mock } from 'bun:test';
import { BloqueValidationError, OPERATION_APPROVAL_HEADER } from '@bloque/sdk';
import { ApprovalGate, type PendingApprovalInfo } from './approval-gate.ts';
import {
  APPROVAL_URL,
  approvalInvalid,
  approvalPending,
  approvalReady,
  approvalRequired,
  callAt,
  connectionLost,
  eventually,
  held,
  json,
  mockFetch,
  testClients,
  transferOk,
  transferParams,
} from './test-support.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function transferRun() {
  const clients = await testClients();
  return (approval?: string) =>
    clients.accounts.transfer(transferParams, {
      idempotencyKey: 'transfer-1',
      approval,
    });
}

describe('ApprovalGate.run', () => {
  it('completes without asking when no approval is needed', async () => {
    const calls = mockFetch([transferOk]);
    const gate = new ApprovalGate();
    const onApprovalRequired = mock(() => {});

    const outcome = await gate.run('transfer', await transferRun(), {
      waitMs: 1000,
      onApprovalRequired,
    });

    expect(outcome).toEqual({
      status: 'completed',
      result: { queueId: 'q_1', status: 'queued', message: 'queued' },
    });
    expect(onApprovalRequired).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
    expect(gate.list()).toEqual([]);
  });

  it('returns approval_required with the link when it may not wait', async () => {
    const calls = mockFetch([approvalRequired]);
    const gate = new ApprovalGate();
    const seen: PendingApprovalInfo[] = [];

    const outcome = await gate.run('Transfer 1 USD', await transferRun(), {
      waitMs: 0,
      onApprovalRequired: (pending) => {
        seen.push(pending);
      },
    });

    expect(outcome.status).toBe('approval_required');
    if (outcome.status !== 'approval_required') throw new Error();
    expect(outcome.approvalId).toStartWith('apr_');
    expect(outcome.operation).toBe('Transfer 1 USD');
    expect(outcome.approvalUrl).toBe(APPROVAL_URL);
    expect(outcome.expiresAt).toBeDefined();
    expect(outcome.summary?.operation).toBe('accounts.transfer');
    expect(seen).toEqual([
      {
        approvalId: outcome.approvalId,
        operation: 'Transfer 1 USD',
        approvalUrl: APPROVAL_URL,
        expiresAt: outcome.expiresAt,
        summary: outcome.summary,
      },
    ]);
    // Only the original call: no polling without a wait.
    expect(calls).toHaveLength(1);
    expect(gate.list().map((p) => p.approvalId)).toEqual([outcome.approvalId]);
  });

  it('waits for the approval and repeats the same request with it', async () => {
    const calls = mockFetch([approvalRequired, approvalReady, transferOk]);
    const gate = new ApprovalGate();

    const outcome = await gate.run('transfer', await transferRun(), {
      waitMs: 5000,
    });

    expect(outcome.status).toBe('completed');
    expect(calls).toHaveLength(3);
    expect(callAt(calls, 1).url).toEndWith(
      '/api/origins/operation-approvals/result',
    );
    expect(callAt(calls, 2).url).toBe(callAt(calls, 0).url);
    expect(callAt(calls, 2).body).toEqual(callAt(calls, 0).body);
    expect(callAt(calls, 2).headers.get('Idempotency-Key')).toBe('transfer-1');
    expect(callAt(calls, 0).headers.has(OPERATION_APPROVAL_HEADER)).toBe(false);
    expect(callAt(calls, 2).headers.get(OPERATION_APPROVAL_HEADER)).toBe(
      'signed-approval',
    );
    expect(gate.list()).toEqual([]);
  });

  it('times out to approval_required, and resume completes it later', async () => {
    const calls = mockFetch([approvalRequired, approvalPending]);
    const gate = new ApprovalGate();

    const outcome = await gate.run('transfer', await transferRun(), {
      waitMs: 50,
    });

    expect(outcome.status).toBe('approval_required');
    if (outcome.status !== 'approval_required') throw new Error();
    expect(calls).toHaveLength(2);

    // The owner approves; checking again runs the operation.
    mockFetch([approvalReady, transferOk]);
    const resumed = await gate.resume(outcome.approvalId, { waitMs: 5000 });

    expect(resumed).toEqual({
      status: 'completed',
      result: { queueId: 'q_1', status: 'queued', message: 'queued' },
    });
    expect(gate.list()).toEqual([]);
  });

  it('reports approval_expired when no approval arrives in time', async () => {
    mockFetch([() => approvalRequired(150), approvalPending]);
    const gate = new ApprovalGate();

    const outcome = await gate.run('transfer', await transferRun(), {
      waitMs: 5000,
    });

    expect(outcome.status).toBe('approval_expired');
    if (outcome.status !== 'approval_expired') throw new Error();
    expect(outcome.reason).toBe('approval_not_received');
    expect(gate.list()).toEqual([]);
  });

  it('reports approval_rejected when the server refuses the approval', async () => {
    mockFetch([approvalRequired, approvalReady, approvalInvalid]);
    const gate = new ApprovalGate();

    const outcome = await gate.run('transfer', await transferRun(), {
      waitMs: 5000,
    });

    expect(outcome.status).toBe('approval_rejected');
    if (outcome.status !== 'approval_rejected') throw new Error();
    expect(outcome.reason).toBe('passkey_rejected');
    expect(gate.list()).toEqual([]);
  });

  it('starts over when the approved repeat asks for a new approval', async () => {
    mockFetch([approvalRequired, approvalReady, approvalRequired]);
    const gate = new ApprovalGate();

    const outcome = await gate.run('transfer', await transferRun(), {
      waitMs: 5000,
    });

    expect(outcome.status).toBe('approval_required');
    expect(gate.list()).toHaveLength(1);
    if (outcome.status !== 'approval_required') throw new Error();
    // Same id: the agent keeps checking the one it already has.
    expect(gate.list()[0]?.approvalId).toBe(outcome.approvalId);
  });

  it('throws other errors as they are', async () => {
    mockFetch([
      () =>
        json(400, {
          error: true,
          code: 'E_VALIDATION',
          message: 'amount is invalid',
        }),
    ]);
    const gate = new ApprovalGate();

    const error = await gate
      .run('transfer', await transferRun(), { waitMs: 0 })
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueValidationError);
  });
});

describe('ApprovalGate sends the approved request at most once', () => {
  /** A transfer waiting for approval, with the ids to resume it. */
  async function pendingTransfer(gate: ApprovalGate, expiresInMs?: number) {
    mockFetch([() => approvalRequired(expiresInMs)]);
    const outcome = await gate.run('transfer', await transferRun(), {
      waitMs: 0,
    });
    if (outcome.status !== 'approval_required') throw new Error();
    return outcome.approvalId;
  }

  const transfers = (calls: { url: string }[]) =>
    calls.filter((call) => call.url.endsWith('/transfer'));

  it('two concurrent checks send one request and get the same result', async () => {
    const gate = new ApprovalGate();
    const approvalId = await pendingTransfer(gate);
    const reply = held(transferOk);
    const calls = mockFetch([approvalReady, reply.respond]);

    const first = gate.resume(approvalId, { waitMs: 5000 });
    const second = gate.resume(approvalId, { waitMs: 5000 });
    await eventually(() => transfers(calls).length === 1);

    // While the approved request is in flight, a check does not send it again.
    expect((await gate.resume(approvalId, { waitMs: 0 })).status).toBe(
      'in_progress',
    );
    reply.release();

    const results = await Promise.all([first, second]);
    expect(results.map((r) => r.status)).toEqual(['completed', 'completed']);
    expect(results[0]).toEqual(results[1]);
    // One shared poll and one approved request.
    expect(calls).toHaveLength(2);
    expect(transfers(calls)).toHaveLength(1);
  });

  it('a check after completion returns the stored result', async () => {
    const gate = new ApprovalGate();
    const approvalId = await pendingTransfer(gate);
    mockFetch([approvalReady, transferOk]);
    const completed = await gate.resume(approvalId, { waitMs: 5000 });
    expect(completed.status).toBe('completed');

    const calls = mockFetch([transferOk]);
    expect(await gate.resume(approvalId, { waitMs: 5000 })).toEqual(completed);
    expect(calls).toHaveLength(0);
  });

  it('a lost reply followed by a re-check does not send a second request', async () => {
    const gate = new ApprovalGate();
    const approvalId = await pendingTransfer(gate);
    const calls = mockFetch([approvalReady, connectionLost, transferOk]);

    const lost = await gate.resume(approvalId, { waitMs: 5000 });
    expect(lost.status).toBe('failed');
    if (lost.status !== 'failed') throw new Error();
    expect(lost.approvalId).toBe(approvalId);

    const again = await gate.resume(approvalId, { waitMs: 5000 });
    expect(again).toEqual(lost);
    expect(transfers(calls)).toHaveLength(1);
    expect(calls).toHaveLength(2);
  });

  it('a cancelled check keeps the entry, and the request still finishes', async () => {
    const gate = new ApprovalGate();
    const approvalId = await pendingTransfer(gate);
    const reply = held(transferOk);
    const calls = mockFetch([approvalReady, reply.respond]);
    const controller = new AbortController();

    const cancelled = gate.resume(approvalId, {
      waitMs: 5000,
      signal: controller.signal,
    });
    await eventually(() => transfers(calls).length === 1);
    controller.abort();
    expect((await cancelled).status).toBe('in_progress');

    reply.release();
    const later = await gate.resume(approvalId, { waitMs: 5000 });
    expect(later.status).toBe('completed');
    expect(transfers(calls)).toHaveLength(1);
  });

  it('a cancelled wait for the approval keeps it resumable', async () => {
    const gate = new ApprovalGate();
    const approvalId = await pendingTransfer(gate);
    mockFetch([approvalPending]);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 20);

    const cancelled = await gate.resume(approvalId, {
      waitMs: 5000,
      signal: controller.signal,
    });
    expect(cancelled.status).toBe('approval_required');
    expect(gate.list().map((p) => p.approvalId)).toEqual([approvalId]);
  });

  it('reports an approval nobody collected before its expiry as expired', async () => {
    const gate = new ApprovalGate();
    const approvalId = await pendingTransfer(gate, 1);
    await Bun.sleep(5);

    const expired = await gate.resume(approvalId);
    expect(expired.status).toBe('approval_expired');
    expect(gate.list()).toEqual([]);
  });
});
