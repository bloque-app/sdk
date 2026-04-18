import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerAccountTools(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'list_accounts',
    {
      description: 'List all financial accounts (cards, virtual pockets, polygon, US bank, Bancolombia) owned by the authenticated user. Optionally filter by account type. Use this to discover what accounts exist before operating on them. Returns URN, status, medium type, and balances for each account.',
      inputSchema: {
        medium: z.enum(['card', 'virtual', 'polygon', 'us-account', 'bancolombia']).optional(),
      },
    },
    async ({ medium }) => {
      const result = await clients.accounts.list({ medium } as any);
      const accounts = result.accounts.map((account: any) => ({
        ...account,
        balance: account.balance ? humanizeBalance(account.balance) : undefined,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(accounts, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_account',
    {
      description: 'Get full details of a specific account by its URN. Returns medium-specific fields (e.g. lastFour and detailsUrl for cards, address for polygon, routing/account numbers for US). Use when you already have a URN and need its current state.',
      inputSchema: { urn: z.string() },
    },
    async ({ urn }) => {
      const account = await clients.accounts.get(urn);
      return {
        content: [{ type: 'text', text: JSON.stringify(account, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_balance',
    {
      description: 'Get the current balance of a single account by URN. Returns balances in human-readable amounts (USD, COP). Use this to check available funds before a transfer.',
      inputSchema: { urn: z.string() },
    },
    async ({ urn }) => {
      const raw = await clients.accounts.balance(urn);
      const balances = humanizeBalance(raw);
      return {
        content: [{ type: 'text', text: JSON.stringify(balances, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_all_balances',
    {
      description: 'Get aggregated balances across ALL accounts owned by the user, grouped by currency. Quick way to see total holdings.',
    },
    async () => {
      const raw = await clients.accounts.balances();
      const balances = humanizeBalance(raw);
      return {
        content: [{ type: 'text', text: JSON.stringify(balances, null, 2) }],
      };
    },
  );
}
