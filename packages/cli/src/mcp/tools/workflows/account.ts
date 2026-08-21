import type { SupportedAsset } from '@bloque/sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { toRaw } from '../../currency.ts';
import type { BloqueClients } from '../../types.ts';

export function registerAccountWorkflows(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'create_account',
    {
      description:
        'Create a financial account — the place where money lives. Sets up a virtual pocket (holds the balance) and a Polygon blockchain address (for receiving USDC/crypto) sharing the same ledger. Use this when you need a shared balance that multiple cards will draw from. The account can receive funds immediately; sending becomes possible once its ledger account finishes registering and the pocket reports status "active". For a single-card setup, use create_card directly (it creates the account automatically).',
      inputSchema: {
        name: z.string().optional().default('Account'),
        fundFromUrn: z.string().optional(),
        fundAmount: z.string().optional(),
        currency: z.string().optional().default('USD'),
      },
    },
    async ({ name, fundFromUrn, fundAmount, currency }) => {
      const pocket = await clients.accounts.virtual.create({ name });
      const polygon = await clients.accounts.polygon.create({ ledgerId: pocket.ledgerId, name });

      let transferResult;
      if (fundFromUrn && fundAmount) {
        const { amount: rawAmount, asset } = toRaw(fundAmount, currency);
        transferResult = await clients.accounts.transfer({
          sourceUrn: fundFromUrn,
          destinationUrn: pocket.urn,
          amount: rawAmount,
          asset: asset as SupportedAsset,
        });
      }

      const result = {
        account: { urn: pocket.urn, ledgerId: pocket.ledgerId },
        polygon: { urn: polygon.urn, address: polygon.address, network: polygon.network },
        funded: !!transferResult,
        transferResult,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
