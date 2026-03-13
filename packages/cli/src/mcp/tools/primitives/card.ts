import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerCardTools(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'create_raw_card',
    {
      description: "Low-level: create a card linked to an existing ledgerId. Does NOT create the virtual account or polygon account. For most cases, use the high-level 'create_card' workflow instead.",
      inputSchema: {
        ledgerId: z.string(),
        name: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        webhookUrl: z.string().optional(),
      },
    },
    async ({ ledgerId, name, metadata, webhookUrl }) => {
      const card = await clients.accounts.card.create({
        ledgerId,
        name,
        metadata,
        webhookUrl,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.registerTool(
    'list_cards',
    {
      description: 'List all cards owned by the user. Returns card URN, last four digits, status, card type, detailsUrl, ledgerId, and balances.',
    },
    async () => {
      const result = await clients.accounts.card.list();
      const cards = result.accounts.map((card: any) => ({
        ...card,
        balance: card.balance ? humanizeBalance(card.balance) : undefined,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(cards, null, 2) }],
      };
    },
  );

  server.registerTool(
    'freeze_card',
    {
      description: 'Temporarily freeze a card, blocking all transactions. The card can be reactivated later with activate_card.',
      inputSchema: { urn: z.string() },
    },
    async ({ urn }) => {
      const card = await clients.accounts.card.freeze(urn);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.registerTool(
    'activate_card',
    {
      description: 'Activate a card. Use to unfreeze a previously frozen card, or to activate a newly created card.',
      inputSchema: { urn: z.string() },
    },
    async ({ urn }) => {
      const card = await clients.accounts.card.activate(urn);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.registerTool(
    'disable_card',
    {
      description: 'Permanently disable a card. This is IRREVERSIBLE — the card cannot be reactivated.',
      inputSchema: { urn: z.string() },
    },
    async ({ urn }) => {
      const card = await clients.accounts.card.disable(urn);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.registerTool(
    'update_card_metadata',
    {
      description: "Update the metadata on a card. Metadata controls spending behavior (spending_control, mcc_whitelist, priority_mcc). For a friendlier interface, use 'configure_spending_rules' workflow.",
      inputSchema: {
        urn: z.string(),
        metadata: z.record(z.string(), z.unknown()),
      },
    },
    async ({ urn, metadata }) => {
      const card = await clients.accounts.card.updateMetadata({ urn, metadata });
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.registerTool(
    'rename_card',
    {
      description: 'Change the display name of a card.',
      inputSchema: {
        urn: z.string(),
        name: z.string(),
      },
    },
    async ({ urn, name }) => {
      const card = await clients.accounts.card.updateName(urn, name);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );
}
