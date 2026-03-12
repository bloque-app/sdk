import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerCardTools(server: McpServer, clients: BloqueClients) {
  server.tool(
    'create_raw_card',
    "Low-level: create a card linked to an existing ledgerId. Does NOT create the virtual account or polygon account. For most cases, use the high-level 'create_card' workflow instead.",
    {
      ledgerId: z.string(),
      name: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
      webhookUrl: z.string().optional(),
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

  server.tool(
    'list_cards',
    'List all cards owned by the user. Returns card URN, last four digits, status, card type, detailsUrl, ledgerId, and balances.',
    {},
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

  server.tool(
    'freeze_card',
    'Temporarily freeze a card, blocking all transactions. The card can be reactivated later with activate_card.',
    { urn: z.string() },
    async ({ urn }) => {
      const card = await clients.accounts.card.freeze(urn);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.tool(
    'activate_card',
    'Activate a card. Use to unfreeze a previously frozen card, or to activate a newly created card.',
    { urn: z.string() },
    async ({ urn }) => {
      const card = await clients.accounts.card.activate(urn);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.tool(
    'disable_card',
    'Permanently disable a card. This is IRREVERSIBLE — the card cannot be reactivated.',
    { urn: z.string() },
    async ({ urn }) => {
      const card = await clients.accounts.card.disable(urn);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.tool(
    'update_card_metadata',
    "Update the metadata on a card. Metadata controls spending behavior (spending_control, mcc_whitelist, priority_mcc). For a friendlier interface, use 'configure_spending_rules' workflow.",
    {
      urn: z.string(),
      metadata: z.record(z.unknown()),
    },
    async ({ urn, metadata }) => {
      const card = await clients.accounts.card.updateMetadata({ urn, metadata });
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.tool(
    'rename_card',
    'Change the display name of a card.',
    {
      urn: z.string(),
      name: z.string(),
    },
    async ({ urn, name }) => {
      const card = await clients.accounts.card.updateName(urn, name);
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    },
  );
}
