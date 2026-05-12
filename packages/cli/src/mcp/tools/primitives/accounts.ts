import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerAccountTools(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'list_accounts',
    {
      description: 'List all financial accounts (cards, virtual pockets, polygon, US bank, Bancolombia, BRE-B) owned by the authenticated user. Optionally filter by account type. Use this to discover what accounts exist before operating on them. Returns URN, status, medium type, and balances for each account.',
      inputSchema: {
        medium: z.enum(['card', 'virtual', 'polygon', 'us-account', 'bancolombia', 'breb']).optional(),
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

  server.registerTool(
    'create_breb_key',
    {
      description: 'Create a BRE-B key account linked to the authenticated user session. Returns { data, error } where data includes the created BRE-B account URN and key metadata.',
      inputSchema: {
        keyType: z.enum(['ID', 'PHONE', 'EMAIL', 'ALPHA', 'BCODE']),
        key: z.string(),
        displayName: z.string().optional(),
        ledgerId: z.string().optional(),
        webhookUrl: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ keyType, key, displayName, ledgerId, webhookUrl, metadata }) => {
      const result = await clients.accounts.breb.createKey({
        keyType,
        key,
        displayName,
        ledgerId,
        webhookUrl,
        metadata,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'resolve_breb_key',
    {
      description: 'Resolve a BRE-B key (phone/email/id/alias/barcode) to obtain recipient routing details and a resolutionId for payouts.',
      inputSchema: {
        keyType: z.enum(['ID', 'PHONE', 'EMAIL', 'ALPHA', 'BCODE']),
        key: z.string(),
      },
    },
    async ({ keyType, key }) => {
      const result = await clients.accounts.breb.resolveKey({
        keyType,
        key,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'decode_breb_qr',
    {
      description: 'Decode a BRE-B QR payload and return parsed data (amount, key, merchant, resolutionId, and embedded resolution when available).',
      inputSchema: {
        qrCodeData: z.string(),
      },
    },
    async ({ qrCodeData }) => {
      const result = await clients.accounts.breb.decodeQr({ qrCodeData });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'suspend_breb_key',
    {
      description: 'Suspend (freeze) a previously created BRE-B key account by account URN.',
      inputSchema: { accountUrn: z.string() },
    },
    async ({ accountUrn }) => {
      const result = await clients.accounts.breb.suspendKey({ accountUrn });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'activate_breb_key',
    {
      description: 'Activate a previously suspended BRE-B key account by account URN.',
      inputSchema: { accountUrn: z.string() },
    },
    async ({ accountUrn }) => {
      const result = await clients.accounts.breb.activateKey({ accountUrn });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'delete_breb_key',
    {
      description: 'Delete a BRE-B key account by account URN.',
      inputSchema: { accountUrn: z.string() },
    },
    async ({ accountUrn }) => {
      const result = await clients.accounts.breb.deleteKey({ accountUrn });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
