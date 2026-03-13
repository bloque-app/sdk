import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { toRaw, toHuman } from '../../currency.ts';

export function registerTransferTools(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'transfer',
    {
      description: "Transfer funds between two accounts. Specify source/destination URN, amount in human-readable format (e.g. '100' for $100), and currency ('USD' or 'COP'). The transfer is queued asynchronously. Returns a queueId to track.",
      inputSchema: {
        sourceUrn: z.string(),
        destinationUrn: z.string(),
        amount: z.string(),
        currency: z.string().default('USD'),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ sourceUrn, destinationUrn, amount, currency, metadata }) => {
      const { amount: rawAmount, asset } = toRaw(amount, currency);
      const result = await clients.accounts.transfer({
        sourceUrn,
        destinationUrn,
        amount: rawAmount,
        asset,
        metadata,
      });
      const humanized = {
        ...result,
        amount: toHuman(rawAmount, asset).amount,
        currency: toHuman(rawAmount, asset).currency,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(humanized, null, 2) }],
      };
    },
  );

  server.registerTool(
    'batch_transfer',
    {
      description: 'Execute multiple transfers in a single batch. Useful for payroll, distributions. Operations are auto-chunked into groups of 80.',
      inputSchema: {
        reference: z.string(),
        operations: z.array(
          z.object({
            fromUrn: z.string(),
            toUrn: z.string(),
            reference: z.string(),
            amount: z.string(),
            currency: z.string().default('USD'),
            metadata: z.record(z.string(), z.unknown()).optional(),
          }),
        ),
        metadata: z.record(z.string(), z.unknown()).optional(),
        webhookUrl: z.string().optional(),
      },
    },
    async ({ reference, operations, metadata, webhookUrl }) => {
      const mappedOps = operations.map((op) => {
        const { amount, asset } = toRaw(op.amount, op.currency);
        return {
          fromUrn: op.fromUrn,
          toUrn: op.toUrn,
          reference: op.reference,
          amount,
          asset,
          metadata: op.metadata,
        };
      });
      const result = await clients.accounts.batchTransfer({
        reference,
        operations: mappedOps,
        metadata,
        webhookUrl,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
