/**
 * Every money-moving tool, over stub clients: the approved repeat is the
 * same request with the same Idempotency-Key, and workflows point a failed
 * approval at their funding step only.
 */
import { describe, expect, it } from 'bun:test';
import {
  BloqueApprovalInvalidError,
  BloqueApprovalRequiredError,
  type BloqueClients,
} from '@bloque/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { APPROVAL_URL } from '../approvals/test-support.ts';
import { APPROVAL_LINK_RULE, registerApprovalTools } from './approvals.ts';
import { registerSwapTools } from './tools/primitives/swap.ts';
import { registerTransferTools } from './tools/primitives/transfers.ts';
import { registerAccountWorkflows } from './tools/workflows/account.ts';
import { registerCardWorkflows } from './tools/workflows/card.ts';
import { registerFundCardWorkflows } from './tools/workflows/fund-card.ts';
import { registerSpendingRulesWorkflows } from './tools/workflows/spending-rules.ts';
import { registerTopupWorkflows } from './tools/workflows/topup.ts';

/** The SDK calls that need the owner's approval. */
const GATED = new Set([
  'accounts.transfer',
  'accounts.batchTransfer',
  'swap.pse.create',
  'swap.bankTransfer.create',
  'swap.breb.create',
]);

type GatedOptions = { idempotencyKey?: string; approval?: string };
type GatedCall = { name: string; params: unknown; options: GatedOptions };
type Handler = (args: unknown[]) => Promise<unknown>;

const POCKET = 'did:bloque:account:virtual:pocket-new';
const CARD = 'did:bloque:account:card:usr-1:crd-new';

/** What every non-gated call answers: enough for each workflow to go on. */
const STUB = {
  urn: POCKET,
  ledgerId: 'ledger-1',
  status: 'active',
  lastFour: '1234',
  address: '0xabc',
  network: 'polygon',
  metadata: {},
  accounts: [{ urn: POCKET, ledgerId: 'ledger-1', status: 'active' }],
  rates: [{ sig: 'rate-sig', ratio: 1, fee: 0 }],
  data: { resolutionId: 'res-1', owner: {}, participant: {}, account: {} },
  order: { id: 'ord-1', fromAmount: '1', toAmount: '1', status: 'pending' },
  execution: {},
  queueId: 'q_1',
};

function approvalRequiredError(): BloqueApprovalRequiredError {
  return new BloqueApprovalRequiredError('', {
    status: 428,
    response: {
      extra_details: {
        approval_token: 'approval-token',
        expires_at: Date.now() + 60_000,
        approval_url: APPROVAL_URL,
        summary: { operation: 'test', fields: {} },
      },
    },
    // The approval poll answers "ready" straight away.
    httpClient: {
      request: async <T>() =>
        ({ status: 'ready', value: 'signed-approval' }) as T,
    },
  });
}

/** First call asks for approval; the approved repeat succeeds. */
const gatedOk: Handler = async ([, options]) => {
  if (!(options as GatedOptions | undefined)?.approval) {
    throw approvalRequiredError();
  }
  return STUB;
};

/**
 * Stub clients: any `clients.a.b.c(...)` resolves to {@link STUB} unless a
 * handler overrides it. Gated calls are recorded.
 */
function stubClients(handlers: Record<string, Handler> = {}) {
  const gatedCalls: GatedCall[] = [];
  const at = (path: string[]): unknown =>
    new Proxy(() => {}, {
      get: (_target, prop) =>
        typeof prop === 'string' && prop !== 'then'
          ? at([...path, prop])
          : undefined,
      apply: (_target, _this, args: unknown[]) => {
        const name = path.join('.');
        if (GATED.has(name)) {
          gatedCalls.push({
            name,
            params: args[0],
            options: { ...(args[1] as GatedOptions) },
          });
          return (handlers[name] ?? gatedOk)(args);
        }
        return handlers[name]?.(args) ?? Promise.resolve(STUB);
      },
    });
  return {
    clients: at([]) as BloqueClients,
    gatedCalls,
  };
}

async function connect(clients: BloqueClients) {
  const server = new McpServer({ name: 'bloque-test', version: '0.0.0' });
  registerTransferTools(server, clients);
  registerSwapTools(server, clients);
  registerTopupWorkflows(server, clients);
  registerFundCardWorkflows(server, clients);
  registerCardWorkflows(server, clients);
  registerAccountWorkflows(server, clients);
  registerSpendingRulesWorkflows(server, clients);
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

const ACC = 'did:bloque:account:virtual:acc-1';
const DEST = 'did:bloque:account:virtual:acc-2';
const kycApproved: Handler = async () => ({ status: 'approved' });
const cardCreated: Handler = async () => ({ ...STUB, urn: CARD });
const pse = {
  bankCode: '1007',
  userType: 0,
  customerEmail: 'owner@example.com',
  userLegalIdType: 'CC',
  userLegalId: '123',
  fullName: 'Account Owner',
  redirectUrl: 'https://example.com/back',
};
const bank = {
  bankAccountType: 'savings',
  bankAccountNumber: '000123',
  bankAccountHolderName: 'Account Owner',
};

/** Every tool that moves money, with arguments it accepts. */
const MONEY_TOOLS: Array<{
  tool: string;
  args: Record<string, unknown>;
  /** The approval sits under `fundingApproval` (workflows). */
  funding?: boolean;
}> = [
  {
    tool: 'transfer',
    args: { sourceUrn: ACC, destinationUrn: DEST, amount: '1' },
  },
  {
    tool: 'batch_transfer',
    args: {
      reference: 'payroll',
      operations: [
        { fromUrn: ACC, toUrn: DEST, reference: 'op-1', amount: '1' },
      ],
    },
  },
  {
    tool: 'create_pse_order',
    args: {
      ...pse,
      rateSig: 'rate-sig',
      toMedium: 'kusama',
      amountSrc: '1000000',
      depositUrn: ACC,
    },
  },
  {
    tool: 'create_bank_transfer_order',
    args: {
      ...bank,
      rateSig: 'rate-sig',
      toMedium: 'bancolombia',
      amountSrc: '1000000',
      sourceAccountUrn: ACC,
      bankAccountHolderIdentificationType: 'CC',
      bankAccountHolderIdentificationValue: '123',
    },
  },
  {
    tool: 'create_breb_order',
    args: {
      rateSig: 'rate-sig',
      amountSrc: '1000000',
      resolutionId: 'res-1',
      keyValue: '3001234567',
      sourceAccountUrn: ACC,
    },
  },
  { tool: 'topup_via_pse', args: { ...pse, accountUrn: ACC, amount: '50000' } },
  {
    tool: 'cashout_to_bank',
    args: {
      ...bank,
      sourceAccountUrn: ACC,
      amount: '10',
      bankName: 'bancolombia',
      idType: 'CC',
      idNumber: '123',
    },
  },
  {
    tool: 'send_to_breb_key',
    args: { sourceAccountUrn: ACC, amount: '10', key: '3001234567' },
  },
  { tool: 'fund_card', args: { cardUrn: CARD, sourceUrn: ACC, amount: '5' } },
  {
    tool: 'create_card',
    args: { fundFromUrn: ACC, fundAmount: '5' },
    funding: true,
  },
  {
    tool: 'create_disposable_card',
    args: { sourceUrn: ACC, amount: '5' },
    funding: true,
  },
  {
    tool: 'create_account',
    args: { fundFromUrn: ACC, fundAmount: '5' },
    funding: true,
  },
  {
    tool: 'add_spending_category',
    args: {
      cardUrn: CARD,
      categoryName: 'food',
      fundFromUrn: ACC,
      fundAmount: '5',
    },
    funding: true,
  },
];

const workflowHandlers = {
  'compliance.kyc.getVerification': kycApproved,
  'accounts.card.create': cardCreated,
};

describe('every money-moving tool', () => {
  it.each(MONEY_TOOLS)(
    '$tool repeats the same request with the same Idempotency-Key on resume',
    async ({ tool, args, funding }) => {
      const { clients, gatedCalls } = stubClients(workflowHandlers);
      const client = await connect(clients);

      const first = parse(
        await client.callTool({ name: tool, arguments: args }),
      );
      const pending = funding ? first.fundingApproval : first;
      expect(pending.status).toBe('approval_required');
      expect(pending.nextStep).toContain(APPROVAL_LINK_RULE);

      const resumed = parse(
        await client.callTool({
          name: 'check_approval',
          arguments: { approvalId: pending.approvalId, waitSeconds: 5 },
        }),
      );
      expect(resumed.status).toBe('completed');

      expect(gatedCalls).toHaveLength(2);
      const [original, approved] = gatedCalls as [GatedCall, GatedCall];
      expect(approved.name).toBe(original.name);
      expect(approved.params).toEqual(original.params);
      expect(original.options.idempotencyKey).toBeString();
      expect(original.options.idempotencyKey).not.toBe('');
      expect(approved.options.idempotencyKey).toBe(
        original.options.idempotencyKey,
      );
      expect(original.options.approval).toBeUndefined();
      expect(approved.options.approval).toBe('signed-approval');
    },
  );

  it('all say the approval link is the owner’s alone', async () => {
    const client = await connect(stubClients().clients);
    const { tools } = await client.listTools();
    const described = new Map(tools.map((t) => [t.name, t.description ?? '']));

    for (const name of [...MONEY_TOOLS.map((t) => t.tool), 'check_approval']) {
      expect(described.get(name)).toContain(APPROVAL_LINK_RULE);
    }
  });
});

describe('workflows that fund what they create', () => {
  it('create_account points a rejected funding approval at transfer only', async () => {
    const { clients, gatedCalls } = stubClients({
      'accounts.transfer': async ([, options]) => {
        if (!(options as GatedOptions | undefined)?.approval) {
          throw approvalRequiredError();
        }
        throw new BloqueApprovalInvalidError('', {
          status: 403,
          response: { extra_details: { reason: 'passkey_rejected' } },
        });
      },
    });
    const client = await connect(clients);

    const created = parse(
      await client.callTool({
        name: 'create_account',
        arguments: { fundFromUrn: ACC, fundAmount: '5' },
      }),
    );
    expect(created.account.urn).toBe(POCKET);
    expect(created.funded).toBe(false);

    const rejected = parse(
      await client.callTool({
        name: 'check_approval',
        arguments: {
          approvalId: created.fundingApproval.approvalId,
          waitSeconds: 5,
        },
      }),
    );
    expect(rejected.status).toBe('approval_rejected');
    expect(rejected.nextStep).toContain('Call transfer with');
    expect(rejected.nextStep).toContain(`destinationUrn "${POCKET}"`);
    expect(rejected.nextStep).toContain(`sourceUrn "${ACC}"`);
    expect(rejected.nextStep).toContain('do not repeat that call');
    expect(rejected.nextStep).not.toContain('Repeat the original operation');
    expect(gatedCalls).toHaveLength(2);
  });
});

describe('fund_card', () => {
  it('reports the transfer when only the balance read fails', async () => {
    const { clients, gatedCalls } = stubClients({
      'accounts.transfer': async () => STUB,
      'accounts.balance': async () => {
        throw new Error('balance unavailable');
      },
    });
    const client = await connect(clients);

    const result = await client.callTool({
      name: 'fund_card',
      arguments: { cardUrn: CARD, sourceUrn: ACC, amount: '5' },
    });

    expect(result.isError).toBeFalsy();
    const body = parse(result);
    expect(body.transferResult.queueId).toBe('q_1');
    expect(body.accountBalance).toBeUndefined();
    expect(gatedCalls).toHaveLength(1);
  });
});
