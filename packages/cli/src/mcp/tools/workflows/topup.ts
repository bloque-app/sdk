import { randomUUID } from 'node:crypto';
import type { SupportedBank } from '@bloque/sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { describeOutcome, runWithApproval } from '../../approvals.ts';
import { toRaw } from '../../currency.ts';
import type { BloqueClients } from '../../types.ts';

export function registerTopupWorkflows(
  server: McpServer,
  clients: BloqueClients,
) {
  server.registerTool(
    'topup_via_pse',
    {
      description:
        'Top up an account with Colombian pesos (COP) via PSE bank transfer. Finds the best exchange rate, creates the PSE order, and returns a checkout URL for the user to complete payment at their bank. If the account owner must approve it with their passkey, returns status "approval_required" with an approvalUrl and approvalId first (see check_approval).',
      inputSchema: {
        accountUrn: z.string(),
        amount: z.string(),
        bankCode: z.string(),
        userType: z.union([z.literal(0), z.literal(1)]),
        customerEmail: z.string(),
        userLegalIdType: z.enum(['CC', 'NIT', 'CE']),
        userLegalId: z.string(),
        fullName: z.string(),
        phoneNumber: z.string().optional(),
        // Required for every PSE payment regardless of gateway — the order
        // is rejected up front without it.
        redirectUrl: z.string(),
        webhookUrl: z.string().optional(),
      },
    },
    async (
      {
        accountUrn,
        amount,
        bankCode,
        userType,
        customerEmail,
        userLegalIdType,
        userLegalId,
        fullName,
        phoneNumber,
        redirectUrl,
        webhookUrl,
      },
      extra,
    ) => {
      const { amount: rawAmount } = toRaw(amount, 'COP');
      const ratesResult = await clients.swap.findRates({
        fromAsset: 'COP/2',
        toAsset: 'DUSD/6',
        fromMediums: ['pse'],
        toMediums: ['kusama'],
        amountSrc: rawAmount,
      });
      const rate = ratesResult.rates[0];
      if (!rate) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { error: 'No exchange rates available for COP → USD via PSE' },
                null,
                2,
              ),
            },
          ],
        };
      }

      const idempotencyKey = randomUUID();
      const outcome = await runWithApproval(
        extra,
        `PSE top-up of ${amount} COP into ${accountUrn}`,
        async (approval) => {
          const orderResult = await clients.swap.pse.create(
            {
              rateSig: rate.sig,
              toMedium: 'kusama',
              amountSrc: rawAmount,
              webhookUrl,
              depositInformation: { urn: accountUrn },
              args: {
                bankCode,
                userType,
                customerEmail,
                userLegalIdType,
                userLegalId,
                customerData: { fullName, phoneNumber: phoneNumber ?? '' },
                redirectUrl,
              },
            },
            { idempotencyKey, approval },
          );
          const how = orderResult.execution?.result?.how;
          const checkoutUrl = how && 'url' in how ? how.url : undefined;
          return {
            order: {
              id: orderResult.order.id,
              fromAmount: orderResult.order.fromAmount,
              toAmount: orderResult.order.toAmount,
              status: orderResult.order.status,
            },
            checkoutUrl,
            rate: { ratio: rate.ratio, fee: rate.fee },
          };
        },
      );
      const result =
        outcome.status === 'completed'
          ? outcome.result
          : {
              ...describeOutcome(outcome),
              rate: { ratio: rate.ratio, fee: rate.fee },
            };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'cashout_to_bank',
    {
      description:
        'Cash out USD to Colombian pesos via bank transfer. Converts from a Bloque account and deposits COP into any Colombian bank account. Handles rate lookup and order creation. May return status "approval_required" with an approvalUrl for the account owner (see check_approval).',
      inputSchema: {
        sourceAccountUrn: z.string(),
        amount: z.string(),
        currency: z.string().optional().default('USD'),
        bankName: z.string(),
        bankAccountType: z.enum(['savings', 'checkings']),
        bankAccountNumber: z.string(),
        bankAccountHolderName: z.string(),
        idType: z.enum(['CC', 'CE', 'NIT', 'PASSPORT']),
        idNumber: z.string(),
        webhookUrl: z.string().optional(),
      },
    },
    async (
      {
        sourceAccountUrn,
        amount,
        currency,
        bankName,
        bankAccountType,
        bankAccountNumber,
        bankAccountHolderName,
        idType,
        idNumber,
        webhookUrl,
      },
      extra,
    ) => {
      const { amount: rawAmount } = toRaw(amount, currency);
      const ratesResult = await clients.swap.findRates({
        fromAsset: 'DUSD/6',
        toAsset: 'COP/2',
        fromMediums: ['kusama'],
        toMediums: [bankName],
        amountSrc: rawAmount,
      });
      const rate = ratesResult.rates[0];
      if (!rate) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: `No exchange rates available for USD → COP via ${bankName}`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const idempotencyKey = randomUUID();
      const outcome = await runWithApproval(
        extra,
        `Cash out ${amount} ${currency} from ${sourceAccountUrn} to ${bankName} account ${bankAccountNumber}`,
        async (approval) => {
          const orderResult = await clients.swap.bankTransfer.create(
            {
              rateSig: rate.sig,
              toMedium: bankName as SupportedBank,
              amountSrc: rawAmount,
              webhookUrl,
              depositInformation: {
                bankAccountType,
                bankAccountNumber,
                bankAccountHolderName,
                bankAccountHolderIdentificationType: idType,
                bankAccountHolderIdentificationValue: idNumber,
              },
              args: { sourceAccountUrn },
            },
            { idempotencyKey, approval },
          );
          return {
            order: {
              id: orderResult.order.id,
              fromAmount: orderResult.order.fromAmount,
              toAmount: orderResult.order.toAmount,
              status: orderResult.order.status,
            },
            rate: { ratio: rate.ratio, fee: rate.fee },
          };
        },
      );
      const result =
        outcome.status === 'completed'
          ? outcome.result
          : {
              ...describeOutcome(outcome),
              rate: { ratio: rate.ratio, fee: rate.fee },
            };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'send_to_breb_key',
    {
      description:
        'Send money to a BRE-B key in one step. Resolves the key, finds exchange rates, and creates the BRE-B payout order. May return status "approval_required" with an approvalUrl for the account owner (see check_approval).',
      inputSchema: {
        sourceAccountUrn: z.string(),
        amount: z.string(),
        sourceCurrency: z.string().default('COPM'),
        targetCurrency: z.string().default('COP'),
        sourceMedium: z.string().default('kusama'),
        keyType: z
          .enum(['ID', 'PHONE', 'MOBILE', 'EMAIL', 'ALPHA', 'BCODE'])
          .optional(),
        key: z.string(),
        webhookUrl: z.string().optional(),
      },
    },
    async (
      {
        sourceAccountUrn,
        amount,
        sourceCurrency,
        targetCurrency,
        sourceMedium,
        keyType,
        key,
        webhookUrl,
      },
      extra,
    ) => {
      const resolution = await clients.accounts.breb.resolveKey({
        key,
        ...(keyType && { keyType }),
      });
      if (resolution.error || !resolution.data) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error:
                    resolution.error?.message ?? 'Failed to resolve BRE-B key',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const { amount: rawAmount, asset: fromAsset } = toRaw(
        amount,
        sourceCurrency,
      );
      const { asset: toAsset } = toRaw('1', targetCurrency);

      const ratesResult = await clients.swap.findRates({
        fromAsset,
        toAsset,
        fromMediums: [sourceMedium],
        toMediums: ['breb'],
        amountSrc: rawAmount,
      });
      const rate = ratesResult.rates[0];
      if (!rate) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: `No exchange rates available for ${fromAsset} → ${toAsset} via ${sourceMedium} -> breb`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const { resolutionId, owner, participant, account } = resolution.data;
      const resolutionView = { resolutionId, owner, participant, account };
      const idempotencyKey = randomUUID();
      const outcome = await runWithApproval(
        extra,
        `BRE-B payout of ${amount} ${sourceCurrency} from ${sourceAccountUrn} to key ${key}`,
        async (approval) => {
          const orderResult = await clients.swap.breb.create(
            {
              rateSig: rate.sig,
              amountSrc: rawAmount,
              webhookUrl,
              depositInformation: {
                resolutionId,
                destinationKey: { keyValue: key, ...(keyType && { keyType }) },
              },
              args: { sourceAccountUrn },
            },
            { idempotencyKey, approval },
          );
          return {
            resolution: resolutionView,
            order: {
              id: orderResult.order.id,
              fromAmount: orderResult.order.fromAmount,
              toAmount: orderResult.order.toAmount,
              status: orderResult.order.status,
            },
            execution: orderResult.execution,
            rate: { ratio: rate.ratio, fee: rate.fee },
          };
        },
      );
      const result =
        outcome.status === 'completed'
          ? outcome.result
          : {
              ...describeOutcome(outcome),
              resolution: resolutionView,
              rate: { ratio: rate.ratio, fee: rate.fee },
            };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
