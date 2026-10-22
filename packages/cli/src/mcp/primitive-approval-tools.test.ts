/**
 * The BRE-B key, card, account and API-key primitives go through the same
 * approval gate as the money-moving tools (#87): a 428 comes back as
 * `approval_required` with the owner's approvalUrl, and `check_approval`
 * repeats the same request once with the approval.
 */
import { describe, expect, it } from 'bun:test';
import { BloqueApprovalRequiredError, type BloqueClients } from '@bloque/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { APPROVAL_URL } from '../approvals/test-support.ts';
import { APPROVAL_LINK_RULE, registerApprovalTools } from './approvals.ts';
import { registerAccountTools } from './tools/primitives/accounts.ts';
import { registerApiKeyTools } from './tools/primitives/api-keys.ts';
import { registerCardTools } from './tools/primitives/card.ts';
import { registerPolygonTools } from './tools/primitives/polygon.ts';
import { registerVirtualTools } from './tools/primitives/virtual.ts';

type Options = { idempotencyKey?: string; approval?: string };
type Recorded = { name: string; params: unknown; options: Options };

const KEY = 'did:bloque:account:breb:key-1';
const CARD = 'did:bloque:account:card:usr-1:crd-1';

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
    httpClient: {
      request: async <T>() =>
        ({ status: 'ready', value: 'signed-approval' }) as T,
    },
  });
}

/** Each wrapped tool, the SDK call it makes, and arguments it accepts. */
const TOOLS: Array<{
  tool: string;
  call: string;
  args: Record<string, unknown>;
  idempotent?: boolean;
}> = [
  {
    tool: 'create_breb_key',
    call: 'accounts.breb.createKey',
    args: { keyType: 'BCODE', key: '0016027228' },
  },
  {
    tool: 'activate_breb_key',
    call: 'accounts.breb.activateKey',
    args: { accountUrn: KEY },
  },
  {
    tool: 'delete_breb_key',
    call: 'accounts.breb.deleteKey',
    args: { accountUrn: KEY },
  },
  {
    tool: 'create_raw_card',
    call: 'accounts.card.create',
    args: { ledgerId: 'ledger-1' },
    idempotent: true,
  },
  {
    tool: 'activate_card',
    call: 'accounts.card.activate',
    args: { urn: CARD },
  },
  {
    tool: 'update_card_metadata',
    call: 'accounts.card.updateMetadata',
    args: { urn: CARD, metadata: { priority_mcc: ['5411'] } },
  },
  {
    tool: 'create_polygon_account',
    call: 'accounts.polygon.create',
    args: { ledgerId: 'ledger-1' },
    idempotent: true,
  },
  {
    tool: 'create_virtual_account',
    call: 'accounts.virtual.create',
    args: { name: 'pocket' },
    idempotent: true,
  },
  {
    tool: 'rotate_api_key',
    call: 'identity.apiKeys.rotate',
    args: { id: 'key-1' },
  },
];

const GATED = new Set(TOOLS.map((t) => t.call));

/** Gated calls ask for an approval until they carry one; all are recorded. */
function stubClients() {
  const calls: Recorded[] = [];
  const at = (path: string[]): unknown =>
    new Proxy(() => {}, {
      get: (_target, prop) =>
        typeof prop === 'string' && prop !== 'then'
          ? at([...path, prop])
          : undefined,
      apply: async (_target, _this, args: unknown[]) => {
        const name = path.join('.');
        if (!GATED.has(name)) return {};
        const options = { ...(args[1] as Options | undefined) };
        calls.push({ name, params: args[0], options });
        if (!options.approval) throw approvalRequiredError();
        return { data: { urn: 'did:bloque:account:new' }, error: null };
      },
    });
  return { clients: at([]) as BloqueClients, calls };
}

async function connect(clients: BloqueClients) {
  const server = new McpServer({ name: 'bloque-test', version: '0.0.0' });
  registerAccountTools(server, clients);
  registerCardTools(server, clients);
  registerPolygonTools(server, clients);
  registerVirtualTools(server, clients);
  registerApiKeyTools(server, clients);
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

describe('BRE-B key, card, account and API-key primitives', () => {
  it.each(TOOLS)(
    '$tool returns the approvalUrl on a 428 and repeats the same request once approved',
    async ({ tool, call, args, idempotent }) => {
      const { clients, calls } = stubClients();
      const client = await connect(clients);

      const first = parse(
        await client.callTool({ name: tool, arguments: args }),
      );
      expect(first.status).toBe('approval_required');
      expect(first.approvalUrl).toBe(APPROVAL_URL);
      expect(first.nextStep).toContain(APPROVAL_LINK_RULE);

      const resumed = parse(
        await client.callTool({
          name: 'check_approval',
          arguments: { approvalId: first.approvalId, waitSeconds: 5 },
        }),
      );
      expect(resumed.status).toBe('completed');

      expect(calls).toHaveLength(2);
      const [original, approved] = calls as [Recorded, Recorded];
      expect(original.name).toBe(call);
      expect(approved.name).toBe(call);
      expect(approved.params).toEqual(original.params);
      expect(original.options.approval).toBeUndefined();
      expect(approved.options.approval).toBe('signed-approval');
      if (idempotent) {
        expect(original.options.idempotencyKey).toBeString();
        expect(approved.options.idempotencyKey).toBe(
          original.options.idempotencyKey,
        );
      }
    },
  );

  it('all say the approval link is the owner’s alone', async () => {
    const client = await connect(stubClients().clients);
    const { tools } = await client.listTools();
    const described = new Map(tools.map((t) => [t.name, t.description ?? '']));
    for (const { tool } of TOOLS) {
      expect(described.get(tool)).toContain(APPROVAL_LINK_RULE);
    }
  });
});
