import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { humanizeBalance } from '../../currency.ts';

export function registerUsTools(server: McpServer, clients: BloqueClients) {
  server.tool(
    'get_us_tos_link',
    'Get a Terms of Service acceptance URL that the user must visit before creating a US bank account.',
    { redirectUri: z.string() },
    async ({ redirectUri }) => {
      const result = await clients.accounts.us.getTosLink({ redirectUri });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'create_us_account',
    'Create a US bank account (routing + account number). Requires the user to have accepted TOS first. Returns account and routing numbers for ACH transfers.',
    {
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
      metadata: z.record(z.unknown()).optional(),
    },
    async (params) => {
      const account = await clients.accounts.us.create(params as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(account, null, 2) }],
      };
    },
  );

  server.tool(
    'list_us_accounts',
    'List all US bank accounts. Shows account/routing numbers, status, and balances.',
    {},
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
}
