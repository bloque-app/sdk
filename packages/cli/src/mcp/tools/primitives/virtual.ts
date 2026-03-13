import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerVirtualTools(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'create_virtual_account',
    {
      description: "Create a virtual account (also called a 'pocket' or 'ledger'). Virtual accounts hold balances and can be linked to cards and polygon accounts via ledgerId. For creating a card, prefer the 'create_card' workflow which handles the pocket automatically.",
      inputSchema: {
        name: z.string().optional(),
        ledgerId: z.string().optional(),
        metadata: z.record(z.string()).optional(),
      },
    },
    async ({ name, ledgerId, metadata }) => {
      const account = await clients.accounts.virtual.create({
        name,
        ledgerId,
        metadata,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(account, null, 2) }],
      };
    },
  );

  server.registerTool(
    'list_virtual_accounts',
    {
      description: 'List all virtual accounts (pockets) owned by the user. Shows name, URN, ledgerId, status, and balances.',
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
