import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { toHuman, resolveAsset } from '../../currency.ts';

export function registerHistoryTools(server: McpServer, clients: BloqueClients) {
  server.tool(
    'list_transactions',
    'List transaction history across ALL accounts. Supports filtering by currency, date range, direction (in/out), and pagination. Use this for a global view of all money movement.',
    {
      currency: z.string().optional(),
      limit: z.number().optional(),
      before: z.string().optional(),
      after: z.string().optional(),
      direction: z.enum(['in', 'out']).optional(),
      next: z.string().optional(),
    },
    async ({ currency, limit, before, after, direction, next }) => {
      const asset = currency ? resolveAsset(currency) : undefined;
      const result = await clients.accounts.transactions({
        asset,
        limit,
        before,
        after,
        direction,
        next,
      } as any);
      const humanizedTxs = result.data.map((tx: any) => {
        const { amount, currency: cur } = toHuman(tx.amount, tx.asset);
        return { ...tx, amount, currency: cur };
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                data: humanizedTxs,
                pageSize: result.pageSize,
                hasMore: result.hasMore,
                next: result.next,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    'list_account_movements',
    'List transaction history for a SPECIFIC account by URN. Shows deposits, withdrawals, and transfers with human-readable amounts.',
    {
      urn: z.string(),
      currency: z.string().optional(),
      limit: z.number().optional(),
      before: z.string().optional(),
      after: z.string().optional(),
      direction: z.enum(['in', 'out']).optional(),
      pocket: z.enum(['main', 'pending']).optional(),
      next: z.string().optional(),
    },
    async ({ urn, currency, limit, before, after, direction, pocket, next }) => {
      const result = await clients.accounts.movements({
        urn,
        asset: currency ? resolveAsset(currency) : undefined,
        limit,
        before,
        after,
        direction,
        pocket,
        next,
      } as any);
      const humanizedMovements = result.data.map((mv: any) => {
        const { amount, currency: cur } = toHuman(mv.amount, mv.asset);
        return { ...mv, amount, currency: cur };
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                data: humanizedMovements,
                pageSize: result.pageSize,
                hasMore: result.hasMore,
                next: result.next,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
