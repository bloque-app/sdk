import { randomUUID } from 'node:crypto';
import type { SupportedAsset } from '@bloque/sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { approvalToolResult, runWithApproval } from '../../approvals.ts';
import { humanizeBalance, toRaw } from '../../currency.ts';
import type { BloqueClients } from '../../types.ts';

export function registerFundCardWorkflows(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'fund_card',
    {
      description:
        "Add funds to a card (tops up its backing account). Provide the card URN and a source — the tool resolves the card's backing account automatically. If multiple cards share the same account, all see the updated balance. May return status 'approval_required' with an approvalUrl for the account owner (see check_approval).",
      inputSchema: {
        cardUrn: z.string(),
        sourceUrn: z.string(),
        amount: z.string(),
        currency: z.string().optional().default('USD'),
      },
    },
    async ({ cardUrn, sourceUrn, amount, currency }, extra) => {
      const cardAccount = await clients.accounts.get(cardUrn);
      const { ledgerId } = cardAccount;
      const { accounts: virtualAccounts } = await clients.accounts.list({ medium: 'virtual' } as any);
      const pocket = virtualAccounts.find((a: any) => a.ledgerId === ledgerId);

      if (!pocket) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(
              { error: `No virtual pocket found with ledgerId ${ledgerId} for card ${cardUrn}` },
              null, 2,
            ),
          }],
        };
      }

      const { amount: rawAmount, asset } = toRaw(amount, currency);
      const idempotencyKey = randomUUID();
      const outcome = await runWithApproval(
        extra,
        `Fund card ${cardUrn} with ${amount} ${currency} from ${sourceUrn}`,
        async (approval) => {
          const transferResult = await clients.accounts.transfer(
            {
              sourceUrn,
              destinationUrn: pocket.urn,
              amount: rawAmount,
              asset: asset as SupportedAsset,
            },
            { idempotencyKey, approval },
          );
          const balance = await clients.accounts.balance(pocket.urn);
          return { transferResult, accountBalance: humanizeBalance(balance) };
        },
      );
      return approvalToolResult(outcome);
    },
  );
}
