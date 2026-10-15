import { afterEach, describe, expect, it } from 'bun:test';
import { OPERATION_APPROVAL_HEADER } from '@bloque/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
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
} from '../approvals/test-support.ts';
import { registerApprovalTools } from './approvals.ts';
import { registerTransferTools } from './tools/primitives/transfers.ts';
import { registerFundCardWorkflows } from './tools/workflows/fund-card.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function connect() {
  const clients = await testClients();
  const server = new McpServer({ name: 'bloque-test', version: '0.0.0' });
  registerTransferTools(server, clients);
  registerFundCardWorkflows(server, clients);
  registerApprovalTools(server);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  return client;
}

// biome-ignore lint/suspicious/noExplicitAny: tool results are free-form JSON
function parse(result: unknown): Record<string, any> {
  const { content } = result as { content: Array<{ text: string }> };
  return JSON.parse(content[0]?.text ?? 'null');
}

const transferArgs = {
  sourceUrn: 'did:bloque:account:virtual:acc-1',
  destinationUrn: 'did:bloque:account:virtual:acc-2',
  amount: '1',
  currency: 'USD',
};

describe('transfer tool with passkey approvals', () => {
  it('returns the result as before when no approval is needed', async () => {
    mockFetch([transferOk]);
    const client = await connect();

    const result = await client.callTool({
      name: 'transfer',
      arguments: transferArgs,
    });

    expect(result.isError).toBeFalsy();
    expect(parse(result)).toEqual({
      queueId: 'q_1',
      status: 'queued',
      message: 'queued',
      amount: '1',
      currency: 'USD',
    });
  });

  it('returns approval_required with the link, then check_approval completes it', async () => {
    const calls = mockFetch([approvalRequired]);
    const client = await connect();

    const first = await client.callTool({
      name: 'transfer',
      arguments: transferArgs,
    });

    expect(first.isError).toBeFalsy();
    const pending = parse(first);
    expect(pending.status).toBe('approval_required');
    expect(pending.approvalUrl).toBe(APPROVAL_URL);
    expect(pending.approvalId).toStartWith('apr_');
    expect(pending.operation).toContain('Transfer 1 USD');
    expect(pending.summary.operation).toBe('accounts.transfer');
    expect(pending.nextStep).toContain('check_approval');
    // Without a progress token the tool does not wait: no polling yet.
    expect(calls).toHaveLength(1);

    const resumedCalls = mockFetch([approvalReady, transferOk]);
    const resumed = await client.callTool({
      name: 'check_approval',
      arguments: { approvalId: pending.approvalId, waitSeconds: 5 },
    });

    expect(parse(resumed)).toEqual({
      status: 'completed',
      result: {
        queueId: 'q_1',
        status: 'queued',
        message: 'queued',
        amount: '1',
        currency: 'USD',
      },
    });
    // The repeat is the same request, now with the approval.
    expect(callAt(resumedCalls, 1).url).toBe(callAt(calls, 0).url);
    expect(callAt(resumedCalls, 1).body).toEqual(callAt(calls, 0).body);
    expect(callAt(resumedCalls, 1).headers.get('Idempotency-Key')).toBe(
      callAt(calls, 0).headers.get('Idempotency-Key'),
    );
    expect(callAt(resumedCalls, 1).headers.get(OPERATION_APPROVAL_HEADER)).toBe(
      'signed-approval',
    );
  });

  it('waits in the same call when the client can show progress', async () => {
    mockFetch([approvalRequired, approvalReady, transferOk]);
    const client = await connect();
    const progress: string[] = [];

    const result = await client.callTool(
      { name: 'transfer', arguments: transferArgs },
      CallToolResultSchema,
      { onprogress: (p) => progress.push(p.message ?? '') },
    );

    expect(parse(result).queueId).toBe('q_1');
    expect(progress).toHaveLength(1);
    expect(progress[0]).toContain(APPROVAL_URL);
  });

  it('check_approval reports approval_rejected and approval_not_found', async () => {
    mockFetch([approvalRequired]);
    const client = await connect();
    const pending = parse(
      await client.callTool({ name: 'transfer', arguments: transferArgs }),
    );

    mockFetch([approvalReady, approvalInvalid]);
    const rejected = parse(
      await client.callTool({
        name: 'check_approval',
        arguments: { approvalId: pending.approvalId, waitSeconds: 5 },
      }),
    );
    expect(rejected.status).toBe('approval_rejected');
    expect(rejected.reason).toBe('passkey_rejected');
    expect(rejected.nextStep).toContain('Nothing has moved');

    // Checking again gives the same answer; nothing is sent again.
    const calls = mockFetch([approvalReady, transferOk]);
    const again = parse(
      await client.callTool({
        name: 'check_approval',
        arguments: { approvalId: pending.approvalId },
      }),
    );
    expect(again.status).toBe('approval_rejected');
    expect(calls).toHaveLength(0);

    const missing = parse(
      await client.callTool({
        name: 'check_approval',
        arguments: { approvalId: 'apr_unknown' },
      }),
    );
    expect(missing.status).toBe('approval_not_found');
    // It cannot know whether the operation ran: never repeat blindly.
    expect(missing.nextStep).toContain('movements');
    expect(missing.nextStep).not.toContain('Repeat the original operation');
  });

  it('check_approval stays approval_required while the owner has not approved', async () => {
    mockFetch([approvalRequired]);
    const client = await connect();
    const pending = parse(
      await client.callTool({ name: 'transfer', arguments: transferArgs }),
    );

    mockFetch([approvalPending]);
    const still = parse(
      await client.callTool({
        name: 'check_approval',
        arguments: { approvalId: pending.approvalId, waitSeconds: 0 },
      }),
    );
    expect(still.status).toBe('approval_required');
    expect(still.approvalId).toBe(pending.approvalId);

    const listed = parse(
      await client.callTool({ name: 'check_approval', arguments: {} }),
    );
    expect(
      listed.pending.map((p: { approvalId: string }) => p.approvalId),
    ).toContain(pending.approvalId);
  });
});

describe('fund_card workflow with passkey approvals', () => {
  it('returns approval_required instead of a raw 428', async () => {
    const cardUrn = 'did:bloque:account:card:usr-1:crd-1';
    const account = (urn: string, medium: string) => ({
      urn,
      medium,
      status: 'active',
      ledger_account_id: 'ledger-1',
      details: {},
      metadata: {},
    });
    mockFetch([
      // accounts.get(cardUrn)
      () => json(200, { account: account(cardUrn, 'card') }),
      // accounts.list({ medium: 'virtual' })
      () =>
        json(200, {
          accounts: [account('did:bloque:account:virtual:pocket-1', 'virtual')],
        }),
      approvalRequired,
    ]);
    const client = await connect();

    const result = await client.callTool({
      name: 'fund_card',
      arguments: {
        cardUrn,
        sourceUrn: 'did:bloque:account:virtual:acc-1',
        amount: '5',
      },
    });

    expect(result.isError).toBeFalsy();
    const body = parse(result);
    expect(body.status).toBe('approval_required');
    expect(body.approvalUrl).toBe(APPROVAL_URL);
    expect(body.operation).toContain(cardUrn);
  });
});
