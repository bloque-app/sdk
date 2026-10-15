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
    expect((await gate.resume(outcome.approvalId)).status).toBe(
      'approval_not_found',
    );
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
