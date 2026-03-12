import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { toRaw } from '../../currency.ts';
import { resolveMccs } from '../../categories.ts';

async function pollUntilActive(
  clients: BloqueClients,
  urn: string,
  timeoutMs = 30_000,
  intervalMs = 2_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const account = await clients.accounts.get(urn);
    if (account.status === 'active') return account.status;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return 'pending';
}

export function registerCardWorkflows(server: McpServer, clients: BloqueClients) {
  server.tool(
    'create_card',
    "Create a card for spending. If accountUrn is provided, the card is attached to that existing account (sharing its balance). If accountUrn is omitted, a new account (pocket + polygon) is created automatically. Optionally restrict to merchant categories using allowedCategories (e.g. 'food', 'transport', 'ads') or allowedMccs (raw MCC codes). Optionally fund the backing account on creation.",
    {
      name: z.string().optional().default('Card'),
      accountUrn: z.string().optional(),
      allowedCategories: z.array(z.string()).optional(),
      allowedMccs: z.array(z.string()).optional(),
      fundFromUrn: z.string().optional(),
      fundAmount: z.string().optional(),
      currency: z.string().optional().default('USD'),
      webhookUrl: z.string().optional(),
    },
    async ({
      name, accountUrn, allowedCategories, allowedMccs,
      fundFromUrn, fundAmount, currency, webhookUrl,
    }) => {
      const me = await clients.identity.me();
      const kyc: any = await clients.compliance.kyc.getVerification({ urn: me.urn });
      if (kyc.status !== 'approved') {
        return {
          content: [{
            type: 'text',
            text: 'KYC verification is not approved. Please run verify_identity first to complete identity verification before creating cards.',
          }],
          isError: true,
        };
      }

      let ledgerId: string;
      let virtualAccount: { urn: string; ledgerId: string };
      let polygon: { urn: string; address: string; network: string };

      if (accountUrn) {
        const existing = await clients.accounts.get(accountUrn);
        ledgerId = existing.ledgerId;
        virtualAccount = { urn: accountUrn, ledgerId };
        const polygonList = await clients.accounts.list({ medium: 'polygon' } as any);
        const match = polygonList.accounts.find((a: any) => a.ledgerId === ledgerId);
        polygon = match
          ? { urn: match.urn, address: match.address, network: match.network }
          : { urn: '', address: '', network: '' };
      } else {
        const pocket = await clients.accounts.virtual.create({ name });
        const poly = await clients.accounts.polygon.create({ ledgerId: pocket.ledgerId, name });
        ledgerId = pocket.ledgerId;
        virtualAccount = { urn: pocket.urn, ledgerId: pocket.ledgerId };
        polygon = { urn: poly.urn, address: poly.address, network: poly.network };
      }

      const card = await clients.accounts.card.create(
        { ledgerId, name, webhookUrl },
        { waitLedger: true },
      );
      await pollUntilActive(clients, card.urn);

      const mccs = resolveMccs(allowedCategories, allowedMccs);
      if (mccs.length > 0) {
        await clients.accounts.card.updateMetadata({
          urn: card.urn,
          metadata: {
            spending_control: 'default',
            mcc_whitelist: mccs,
            preferred_asset: 'DUSD/6',
            default_asset: 'DUSD/6',
          },
        });
      }

      let transferResult;
      if (fundFromUrn && fundAmount) {
        const { amount: rawAmount, asset } = toRaw(fundAmount, currency);
        transferResult = await clients.accounts.transfer({
          sourceUrn: fundFromUrn,
          destinationUrn: virtualAccount.urn,
          amount: rawAmount,
          asset,
        });
      }

      const result = {
        card: {
          urn: card.urn, lastFour: card.lastFour, status: card.status,
          detailsUrl: card.detailsUrl, ledgerId: card.ledgerId,
        },
        account: { urn: virtualAccount.urn, ledgerId },
        polygon,
        funded: !!transferResult,
        transferResult,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'create_disposable_card',
    'Create a one-time disposable card with an exact funded amount. Creates an isolated account + card, funds it with the exact amount, so the card can never be charged more. Perfect for untrusted online purchases. Call disable_card after use.',
    {
      name: z.string().optional().default('Disposable Card'),
      sourceUrn: z.string(),
      amount: z.string(),
      currency: z.string().optional().default('USD'),
      allowedCategories: z.array(z.string()).optional(),
      allowedMccs: z.array(z.string()).optional(),
      webhookUrl: z.string().optional(),
    },
    async ({
      name, sourceUrn, amount, currency,
      allowedCategories, allowedMccs, webhookUrl,
    }) => {
      const me = await clients.identity.me();
      const kyc: any = await clients.compliance.kyc.getVerification({ urn: me.urn });
      if (kyc.status !== 'approved') {
        return {
          content: [{
            type: 'text',
            text: 'KYC verification is not approved. Please run verify_identity first to complete identity verification before creating cards.',
          }],
          isError: true,
        };
      }

      const pocket = await clients.accounts.virtual.create({ name });
      const polygon = await clients.accounts.polygon.create({
        ledgerId: pocket.ledgerId,
        name,
      });
      const card = await clients.accounts.card.create(
        { ledgerId: pocket.ledgerId, name, webhookUrl },
        { waitLedger: true },
      );
      await pollUntilActive(clients, card.urn);

      const { amount: rawAmount, asset } = toRaw(amount, currency);
      const transferResult = await clients.accounts.transfer({
        sourceUrn,
        destinationUrn: pocket.urn,
        amount: rawAmount,
        asset,
      });

      const mccs = resolveMccs(allowedCategories, allowedMccs);
      if (mccs.length > 0) {
        await clients.accounts.card.updateMetadata({
          urn: card.urn,
          metadata: {
            spending_control: 'default',
            mcc_whitelist: mccs,
            preferred_asset: 'DUSD/6',
            default_asset: 'DUSD/6',
          },
        });
      }

      const result = {
        card: {
          urn: card.urn, lastFour: card.lastFour, status: card.status,
          detailsUrl: card.detailsUrl, ledgerId: card.ledgerId,
        },
        account: { urn: pocket.urn, ledgerId: pocket.ledgerId },
        polygon: { urn: polygon.urn, address: polygon.address, network: polygon.network },
        funded: true,
        transferResult,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
