import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { toRaw, humanizeBalance } from '../../currency.ts';
import { resolveMccs } from '../../categories.ts';

/**
 * Extracts a bare domain from a URL or domain string.
 * Strips protocol, path, query, port, and leading "www.".
 * Falls back to treating the raw input as a domain if URL parsing fails.
 */
export function extractDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let hostname: string;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    hostname = new URL(withProto).hostname;
  } catch {
    hostname = trimmed.split('/')[0]?.split('?')[0]?.split('#')[0] ?? trimmed;
  }

  hostname = hostname.replace(/:\d+$/, '');
  if (hostname.startsWith('www.')) hostname = hostname.slice(4);
  return hostname.toLowerCase() || null;
}

/**
 * Checks whether `domain` matches any pattern in `allowedWebsites`.
 * A pattern matches if the domain equals it exactly, or the domain
 * is a subdomain (e.g. pattern "amazon.com" matches "smile.amazon.com"
 * but NOT "notamazon.com").
 */
export function matchDomain(
  domain: string,
  allowedWebsites: unknown,
): boolean {
  if (!Array.isArray(allowedWebsites)) return false;
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  return allowedWebsites.some((pattern) => {
    if (typeof pattern !== 'string') return false;
    const p = pattern.toLowerCase().replace(/^www\./, '');
    return normalized === p || normalized.endsWith(`.${p}`);
  });
}

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
  server.registerTool(
    'create_card',
    {
      description:
        "Create a card for spending. If accountUrn is provided, the card is attached to that existing account (sharing its balance). If accountUrn is omitted, a new account (pocket + polygon) is created automatically. Optionally restrict to merchant categories using allowedCategories (e.g. 'food', 'transport', 'ads') or allowedMccs (raw MCC codes). Optionally fund the backing account on creation.",
      inputSchema: {
        name: z.string().optional().default('Card'),
        accountUrn: z.string().optional(),
        allowedCategories: z.array(z.string()).optional(),
        allowedMccs: z.array(z.string()).optional(),
        websites: z.array(z.string()).optional().describe('Domains this card should be used for (e.g. "amazon.com", "netflix.com")'),
        fundFromUrn: z.string().optional(),
        fundAmount: z.string().optional(),
        currency: z.string().optional().default('USD'),
        webhookUrl: z.string().optional(),
      },
    },
    async ({
      name, accountUrn, allowedCategories, allowedMccs,
      websites, fundFromUrn, fundAmount, currency, webhookUrl,
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
      const normalizedWebsites = (websites ?? [])
        .map((w) => extractDomain(w))
        .filter((d): d is string => d !== null);

      if (mccs.length > 0 || normalizedWebsites.length > 0) {
        const metadata: Record<string, unknown> = {};
        if (mccs.length > 0) {
          metadata.spending_control = 'default';
          metadata.mcc_whitelist = mccs;
          metadata.preferred_asset = 'DUSD/6';
          metadata.default_asset = 'DUSD/6';
        }
        if (normalizedWebsites.length > 0) {
          metadata.allowed_websites = normalizedWebsites;
        }
        await clients.accounts.card.updateMetadata({
          urn: card.urn,
          metadata,
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

  server.registerTool(
    'create_disposable_card',
    {
      description:
        'Create a one-time disposable card with an exact funded amount. Creates an isolated account + card, funds it with the exact amount, so the card can never be charged more. Perfect for untrusted online purchases. Call disable_card after use.',
      inputSchema: {
        name: z.string().optional().default('Disposable Card'),
        sourceUrn: z.string(),
        amount: z.string(),
        currency: z.string().optional().default('USD'),
        allowedCategories: z.array(z.string()).optional(),
        allowedMccs: z.array(z.string()).optional(),
        websites: z.array(z.string()).optional().describe('Domains this card should be used for (e.g. "amazon.com")'),
        webhookUrl: z.string().optional(),
      },
    },
    async ({
      name, sourceUrn, amount, currency,
      allowedCategories, allowedMccs, websites, webhookUrl,
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
      const normalizedWebsites = (websites ?? [])
        .map((w) => extractDomain(w))
        .filter((d): d is string => d !== null);

      if (mccs.length > 0 || normalizedWebsites.length > 0) {
        const metadata: Record<string, unknown> = {};
        if (mccs.length > 0) {
          metadata.spending_control = 'default';
          metadata.mcc_whitelist = mccs;
          metadata.preferred_asset = 'DUSD/6';
          metadata.default_asset = 'DUSD/6';
        }
        if (normalizedWebsites.length > 0) {
          metadata.allowed_websites = normalizedWebsites;
        }
        await clients.accounts.card.updateMetadata({
          urn: card.urn,
          metadata,
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

  server.registerTool(
    'resolve_card_for_website',
    {
      description:
        'Find which card(s) to use for a given website. Searches allowed_websites in card metadata. Returns all active matching cards with balances. If no card matches, returns all active cards so you can pick or assign one.',
      inputSchema: {
        url: z.string().describe('URL or domain name to match (e.g. "https://amazon.com/dp/123" or "amazon.com")'),
      },
    },
    async ({ url }) => {
      const domain = extractDomain(url);
      if (!domain) {
        return {
          content: [{ type: 'text', text: 'A URL or domain name is required.' }],
          isError: true,
        };
      }

      const result = await clients.accounts.card.list();
      const activeCards = result.accounts.filter(
        (c: any) => c.status === 'active',
      );

      const matches = activeCards.filter((c: any) =>
        matchDomain(domain, c.metadata?.allowed_websites),
      );

      const formatCard = (card: any) => ({
        urn: card.urn,
        name: card.metadata?.name,
        lastFour: card.lastFour,
        status: card.status,
        websites: Array.isArray(card.metadata?.allowed_websites)
          ? card.metadata.allowed_websites
          : [],
        balance: card.balance ? humanizeBalance(card.balance) : undefined,
        ledgerId: card.ledgerId,
      });

      if (matches.length > 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              searchedDomain: domain,
              matched: true,
              cards: matches.map(formatCard),
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            searchedDomain: domain,
            matched: false,
            message: `No card is assigned to "${domain}". Here are all active cards — you can assign one using assign_card_to_website.`,
            cards: activeCards.map(formatCard),
          }, null, 2),
        }],
      };
    },
  );

  server.registerTool(
    'assign_card_to_website',
    {
      description:
        'Associate a card with one or more websites. The agent will then be able to resolve which card to use for a given website via resolve_card_for_website. By default, websites are merged with any existing website assignments. Set merge=false to replace the list entirely.',
      inputSchema: {
        cardUrn: z.string(),
        websites: z.array(z.string()).describe('Domains to assign (e.g. ["amazon.com", "aws.amazon.com"])'),
        merge: z.boolean().optional().default(true).describe('Merge with existing websites (true) or replace them (false)'),
      },
    },
    async ({ cardUrn, websites, merge }) => {
      const normalizedNew = websites
        .map((w) => extractDomain(w))
        .filter((d): d is string => d !== null);

      if (normalizedNew.length === 0) {
        return {
          content: [{ type: 'text', text: 'At least one valid domain is required.' }],
          isError: true,
        };
      }

      const card: any = await clients.accounts.get(cardUrn);
      const existing = card.metadata ?? {};

      let mergedWebsites: string[];
      if (merge && Array.isArray(existing.allowed_websites)) {
        const validExisting = existing.allowed_websites.filter(
          (w: unknown): w is string => typeof w === 'string',
        );
        mergedWebsites = [...new Set([...validExisting, ...normalizedNew])];
      } else {
        mergedWebsites = [...new Set(normalizedNew)];
      }

      const updatedCard = await clients.accounts.card.updateMetadata({
        urn: cardUrn,
        metadata: {
          ...existing,
          allowed_websites: mergedWebsites,
        },
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            card: {
              urn: updatedCard.urn,
              lastFour: updatedCard.lastFour,
              status: updatedCard.status,
            },
            allowedWebsites: mergedWebsites,
          }, null, 2),
        }],
      };
    },
  );
}
