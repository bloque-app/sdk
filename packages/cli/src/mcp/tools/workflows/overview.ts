import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { toHuman, humanizeBalance } from '../../currency.ts';

export function registerOverviewWorkflows(server: McpServer, clients: BloqueClients) {
  server.tool(
    'wallet_overview',
    "Get a complete financial overview in a single call. Returns all accounts grouped by type, with polygon addresses and attached cards, aggregated balances, and recent transactions. Use as the starting point when the user asks 'what do I have?'.",
    {},
    async () => {
      const { accounts } = await clients.accounts.list();
      const rawBalances = await clients.accounts.balances();
      const txs = await clients.accounts.transactions({ limit: 10 });

      const grouped: Record<string, any[]> = {
        cards: [],
        virtual: [],
        polygon: [],
        us: [],
        bancolombia: [],
      };

      for (const account of accounts) {
        const humanized = {
          ...account,
          balance: (account as any).balance ? humanizeBalance((account as any).balance) : undefined,
        };
        switch ((account as any).medium) {
          case 'card':
            grouped.cards.push(humanized);
            break;
          case 'virtual':
            grouped.virtual.push(humanized);
            break;
          case 'polygon':
            grouped.polygon.push(humanized);
            break;
          case 'us-account':
            grouped.us.push(humanized);
            break;
          case 'bancolombia':
            grouped.bancolombia.push(humanized);
            break;
          default:
            if (!grouped[(account as any).medium]) grouped[(account as any).medium] = [];
            grouped[(account as any).medium].push(humanized);
        }
      }

      const humanizedTxs = txs.data.map((tx: any) => {
        const { amount, currency } = toHuman(tx.amount, tx.asset);
        return { ...tx, amount, currency };
      });

      const result = {
        accounts: grouped,
        totalBalances: humanizeBalance(rawBalances),
        recentTransactions: humanizedTxs,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'card_summary',
    "Get everything about a specific card: details (lastFour, status, detailsUrl), backing account, polygon address, balance, MCC restrictions, smart routing config, and recent movements. The detailsUrl is a PCI-compliant link for the USER to open to view full card number/CVV/expiry — the agent cannot read these.",
    {
      cardUrn: z.string(),
      movementsLimit: z.number().optional().default(10),
    },
    async ({ cardUrn, movementsLimit }) => {
      const card: any = await clients.accounts.get(cardUrn);
      const rawBalance = await clients.accounts.balance(cardUrn);

      let polygonAccount: { urn: string; address: string; network: string } | null = null;
      try {
        const { accounts: polygonAccounts } = await clients.accounts.list({ medium: 'polygon' } as any);
        const match = polygonAccounts.find((a: any) => a.ledgerId === card.ledgerId);
        if (match) {
          polygonAccount = {
            urn: match.urn,
            address: (match as any).details?.address ?? (match as any).address,
            network: (match as any).details?.network ?? (match as any).network,
          };
        }
      } catch {}

      let movements: any[] = [];
      let movementsMeta: any = {};
      try {
        const mvResult = await clients.accounts.movements({ urn: cardUrn, limit: movementsLimit } as any);
        movements = mvResult.data;
        movementsMeta = {
          pageSize: mvResult.pageSize,
          hasMore: mvResult.hasMore,
          next: mvResult.next,
        };
      } catch {}

      const details = card.details ?? card;
      const metadata = card.metadata ?? {};

      const humanizedMovements = movements.map((mv: any) => {
        const { amount, currency } = toHuman(mv.amount, mv.asset);
        return { ...mv, amount, currency };
      });

      const result = {
        card: {
          urn: card.urn,
          lastFour: details.lastFour ?? details.last_four,
          status: details.status ?? card.status,
          detailsUrl: details.detailsUrl ?? details.details_url,
          cardType: details.cardType ?? details.card_type,
          ledgerId: card.ledgerId,
        },
        account: null,
        polygonAddress: polygonAccount?.address ?? null,
        balance: humanizeBalance(rawBalance),
        restrictions: {
          mccWhitelist: metadata.mcc_whitelist ?? null,
          spendingControl: metadata.spending_control ?? null,
        },
        smartRouting: metadata.priority_mcc ?? null,
        recentMovements: {
          data: humanizedMovements,
          ...movementsMeta,
        },
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
