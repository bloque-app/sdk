import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerPolygonTools(server: McpServer, clients: BloqueClients) {
  server.tool(
    'create_polygon_account',
    "Low-level: create a Polygon blockchain account. If ledgerId is provided, shares that ledger's balance. For most cases, use the 'create_card' workflow which creates it automatically.",
    {
      ledgerId: z.string().optional(),
      name: z.string().optional(),
      metadata: z.record(z.string()).optional(),
    },
    async ({ ledgerId, name, metadata }) => {
      const account = await clients.accounts.polygon.create({
        ledgerId,
        name,
        metadata,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(account, null, 2) }],
      };
    },
  );

  server.tool(
    'list_polygon_accounts',
    'List all Polygon blockchain accounts. Shows wallet address, network, URN, ledgerId, and balances.',
    {},
    async () => {
      const result = await clients.accounts.polygon.list();
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
