import { randomUUID } from 'node:crypto';
import type { SupportedAsset } from '@bloque/sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { approvalToolResult, runWithApproval } from '../../approvals.ts';
import { toHuman, toRaw } from '../../currency.ts';
import type { BloqueClients } from '../../types.ts';

export function registerTransferTools(
  server: McpServer,
  clients: BloqueClients,
) {
  server.registerTool(
    'transfer',
    {
      description:
        "Transfer funds between two accounts. Specify source/destination URN, amount in human-readable format (e.g. '100' for $100), and currency ('USD' or 'COP'). The transfer is queued asynchronously. Returns a queueId to track. If the account owner must approve it with their passkey, returns status 'approval_required' with an approvalUrl to share and an approvalId for check_approval.",
      inputSchema: {
        sourceUrn: z.string(),
        destinationUrn: z.string(),
        amount: z.string(),
        currency: z.string().default('USD'),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (
      { sourceUrn, destinationUrn, amount, currency, metadata },
      extra,
    ) => {
      const { amount: rawAmount, asset } = toRaw(amount, currency);
      // Same key on the first call and on the approved repeat.
      const idempotencyKey = randomUUID();
      const outcome = await runWithApproval(
        extra,
        `Transfer ${amount} ${currency} from ${sourceUrn} to ${destinationUrn}`,
        async (approval) => {
          const result = await clients.accounts.transfer(
            {
              sourceUrn,
              destinationUrn,
              amount: rawAmount,
              asset: asset as SupportedAsset,
              metadata,
            },
            { idempotencyKey, approval },
          );
          const human = toHuman(rawAmount, asset);
          return { ...result, amount: human.amount, currency: human.currency };
        },
      );
      return approvalToolResult(outcome);
    },
  );

  server.registerTool(
    'batch_transfer',
    {
      description:
        'Execute multiple transfers in a single batch. Useful for payroll, distributions. Operations are auto-chunked into groups of 80. May return status "approval_required" (see check_approval).',
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
    async ({ reference, operations, metadata, webhookUrl }, extra) => {
      const mappedOps = operations.map((op) => {
        const { amount, asset } = toRaw(op.amount, op.currency);
        return {
          fromUrn: op.fromUrn,
          toUrn: op.toUrn,
          reference: op.reference,
          amount,
          asset: asset as SupportedAsset,
          metadata: op.metadata,
        };
      });
      const idempotencyKey = randomUUID();
      const outcome = await runWithApproval(
        extra,
        `Batch transfer "${reference}" (${operations.length} operations)`,
        (approval) =>
          clients.accounts.batchTransfer(
            { reference, operations: mappedOps, metadata, webhookUrl },
            { idempotencyKey, approval },
          ),
      );
      return approvalToolResult(outcome);
    },
  );
}
