import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerUsTools(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'get_us_tos_link',
    {
      description:
        'Get a Terms of Service acceptance URL that the user must visit before creating a US bank account.',
      inputSchema: { redirectUri: z.string() },
    },
    async ({ redirectUri }) => {
      const result = await clients.accounts.us.getTosLink({ redirectUri });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'create_us_account',
    {
      description:
        'Create a US bank account (routing + account number). Requires the user to have accepted TOS first. Returns account and routing numbers for ACH transfers.',
      inputSchema: {
        type: z.enum(['individual', 'business']),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        phone: z.string(),
        address: z.object({
          streetLine1: z.string(),
          streetLine2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        }),
        birthDate: z.string(),
        taxIdentificationNumber: z.string(),
        govIdCountry: z.string(),
        govIdImageFront: z.string(),
        signedAgreementId: z.string(),
        name: z.string().optional(),
        ledgerId: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (params) => {
      const account = await clients.accounts.us.create(params as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(account, null, 2) }],
      };
    },
  );

  server.registerTool(
    'list_us_accounts',
    {
      description:
        'List all US bank accounts. Shows account/routing numbers, status, and balances.',
    },
    async () => {
      const result = await clients.accounts.us.list();
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
    'create_us2_account',
    {
      description:
        'Create a US2 bank account backed by the new Kira flow. Initial support is individual-only and requires proofOfAddress. Bank instructions may not be available immediately after creation because provisioning is asynchronous.',
      inputSchema: {
        type: z.literal('individual'),
        email: z.string(),
        phone: z.string().optional(),
        taxId: z.string().optional(),
        address: z
          .object({
            street: z.string(),
            city: z.string(),
            state: z.string(),
            postalCode: z.string(),
            country: z.string(),
          })
          .optional(),
        proofOfAddress: z.record(z.string(), z.unknown()),
        name: z.string().optional(),
        webhookUrl: z.string().optional(),
        ledgerId: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (params) => {
      const account = await clients.accounts.us2.create(params as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(account, null, 2) }],
      };
    },
  );

  server.registerTool(
    'list_us2_accounts',
    {
      description:
        'List all US2 bank accounts. Shows lifecycle state, balances, and sourceDepositInstructions when the async virtual-account provisioning has completed.',
    },
    async () => {
      const result = await clients.accounts.us2.list();
      const accounts = result.accounts.map((account: any) => ({
        ...account,
        balance: account.balance ? humanizeBalance(account.balance) : undefined,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(accounts, null, 2) }],
      };
    },
  );
}
