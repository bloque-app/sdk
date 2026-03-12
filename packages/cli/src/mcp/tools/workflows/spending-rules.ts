import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { toRaw } from '../../currency.ts';
import { resolveMccs } from '../../categories.ts';

export function registerSpendingRulesWorkflows(server: McpServer, clients: BloqueClients) {
  server.tool(
    'configure_spending_rules',
    "Advanced: configure smart spending rules that route a card's transactions across MULTIPLE accounts based on merchant category. Each route maps categories/MCCs to an account. Purchases are checked in route order; first match is debited. Routes without categories act as catch-all. Use create_card with allowedCategories for simple restrictions; use this only when one card needs to draw from multiple balance pools.",
    {
      cardUrn: z.string(),
      routes: z.array(
        z.object({
          accountUrn: z.string(),
          categories: z.array(z.string()).optional(),
          mccs: z.array(z.string()).optional(),
        }),
      ),
    },
    async ({ cardUrn, routes }) => {
      const allMccs: string[] = [];
      const priorityMcc: Record<string, { asset: string; account_urn: string }> = {};
      let defaultAccountUrn: string | undefined;

      for (const route of routes) {
        const resolved = resolveMccs(route.categories, route.mccs);
        if (resolved.length === 0) {
          defaultAccountUrn = route.accountUrn;
          continue;
        }
        for (const mcc of resolved) {
          allMccs.push(mcc);
          priorityMcc[mcc] = { asset: 'DUSD/6', account_urn: route.accountUrn };
        }
      }

      const metadata: Record<string, unknown> = {
        spending_control: 'smart',
        preferred_asset: 'DUSD/6',
        default_asset: 'DUSD/6',
        mcc_whitelist: [...new Set(allMccs)],
        priority_mcc: priorityMcc,
      };
      if (defaultAccountUrn) {
        metadata.default_account_urn = defaultAccountUrn;
      }

      const updatedCard = await clients.accounts.card.updateMetadata({
        urn: cardUrn,
        metadata,
      });

      const summary = routes.map((route) => {
        const resolved = resolveMccs(route.categories, route.mccs);
        return {
          accountUrn: route.accountUrn,
          categories: route.categories ?? [],
          mccs: resolved,
          isCatchAll: resolved.length === 0,
        };
      });
      const result = { updatedCard, configuredRoutes: summary };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'add_spending_category',
    "Add a new spending category to a card's smart routing. Creates a new account for the category and wires it into the routing rules. If the card doesn't have smart routing yet, it is automatically enabled.",
    {
      cardUrn: z.string(),
      categoryName: z.string(),
      categories: z.array(z.string()).optional(),
      mccs: z.array(z.string()).optional(),
      fundFromUrn: z.string().optional(),
      fundAmount: z.string().optional(),
      currency: z.string().optional().default('USD'),
    },
    async ({ cardUrn, categoryName, categories, mccs, fundFromUrn, fundAmount, currency }) => {
      const pocket = await clients.accounts.virtual.create({ name: categoryName });
      const polygon = await clients.accounts.polygon.create({
        ledgerId: pocket.ledgerId,
        name: categoryName,
      });

      const card: any = await clients.accounts.get(cardUrn);
      const existing = card.metadata ?? {};
      const newMccs = resolveMccs(categories, mccs);
      const existingWhitelist: string[] = existing.mcc_whitelist ?? [];
      const existingPriority: Record<string, unknown> = existing.priority_mcc ?? {};

      const mergedWhitelist = [...new Set([...existingWhitelist, ...newMccs])];
      const mergedPriority: Record<string, unknown> = { ...existingPriority };
      for (const mcc of newMccs) {
        mergedPriority[mcc] = { asset: 'DUSD/6', account_urn: pocket.urn };
      }

      const mergedMetadata = {
        ...existing,
        spending_control: 'smart',
        preferred_asset: 'DUSD/6',
        default_asset: 'DUSD/6',
        mcc_whitelist: mergedWhitelist,
        priority_mcc: mergedPriority,
      };

      const updatedCard = await clients.accounts.card.updateMetadata({
        urn: cardUrn,
        metadata: mergedMetadata,
      });

      let transferResult;
      if (fundFromUrn && fundAmount) {
        const { amount: rawAmount, asset } = toRaw(fundAmount, currency);
        transferResult = await clients.accounts.transfer({
          sourceUrn: fundFromUrn,
          destinationUrn: pocket.urn,
          amount: rawAmount,
          asset,
        });
      }

      const result = {
        account: { urn: pocket.urn, ledgerId: pocket.ledgerId },
        polygon: { urn: polygon.urn, address: polygon.address },
        updatedCard,
        funded: !!transferResult,
        transferResult,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
