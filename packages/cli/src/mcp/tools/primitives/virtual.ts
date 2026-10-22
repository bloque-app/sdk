import { randomUUID } from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { humanizeBalance } from '../../currency.ts';
import {
  APPROVAL_TOOL_NOTE,
  approvalToolResult,
  runWithApproval,
} from '../../approvals.ts';
import type { BloqueClients } from '../../types.ts';

export function registerVirtualTools(
  server: McpServer,
  clients: BloqueClients,
) {
  server.registerTool(
    'create_virtual_account',
    {
      description:
        `Create a virtual account (also called a 'pocket'). This is the account type that holds a balance; cards and polygon accounts link to it via its ledgerId to share that balance. Each one opens its own new ledger account; the returned ledgerId is usable immediately, so you can link other accounts to it in the very next call. The account starts 'creation_in_progress' and can receive funds right away, but cannot send until its status is 'active'. For creating a card, prefer the 'create_card' workflow which handles the pocket automatically. ${APPROVAL_TOOL_NOTE}`,
      inputSchema: {
        name: z.string().optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      },
    },
    async ({ name, metadata }, extra) => {
      // One key per tool call: the approved repeat is the same request.
      const idempotencyKey = randomUUID();
      return approvalToolResult(
        await runWithApproval(extra, 'Create a virtual account', (approval) =>
          clients.accounts.virtual.create(
            { name, metadata },
            { idempotencyKey, approval },
          ),
        ),
      );
    },
  );

  server.registerTool(
    'list_virtual_accounts',
    {
      description:
        'List all virtual accounts (pockets) owned by the user. Shows name, URN, ledgerId, status, and balances.',
    },
    async () => {
      const result = await clients.accounts.virtual.list();
      const accounts = result.accounts.map((account: any) => ({
        ...account,
        balance: account.balance ? humanizeBalance(account.balance) : undefined,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(accounts, null, 2) }],
      };
    },
  );
}
