import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import { toRaw } from '../../currency.ts';

export function registerTopupWorkflows(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'topup_via_pse',
    {
      description:
        'Top up an account with Colombian pesos (COP) via PSE bank transfer. Finds the best exchange rate, creates the PSE order, and returns a checkout URL for the user to complete payment at their bank.',
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
        webhookUrl: z.string().optional(),
      },
    },
    async ({
      accountUrn, amount, bankCode, userType,
      customerEmail, userLegalIdType, userLegalId,
      fullName, phoneNumber, webhookUrl,
    }) => {
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
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'No exchange rates available for COP → USD via PSE' }, null, 2),
          }],
        };
      }

      const orderResult = await clients.swap.pse.create({
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
        },
      });

      const checkoutUrl = orderResult.execution?.result?.how?.url;
      const result = {
        order: {
          id: orderResult.order.id,
          fromAmount: orderResult.order.fromAmount,
          toAmount: orderResult.order.toAmount,
          status: orderResult.order.status,
        },
        checkoutUrl,
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
        'Cash out USD to Colombian pesos via bank transfer. Converts from a Bloque account and deposits COP into any Colombian bank account. Handles rate lookup and order creation.',
      inputSchema: {
        sourceAccountUrn: z.string(),
        amount: z.string(),
        currency: z.string().optional().default('USD'),
        bankName: z.string(),
        bankAccountType: z.enum(['savings', 'checking']),
        bankAccountNumber: z.string(),
        bankAccountHolderName: z.string(),
        idType: z.enum(['CC', 'CE', 'NIT', 'PP']),
        idNumber: z.string(),
        webhookUrl: z.string().optional(),
      },
    },
    async ({
      sourceAccountUrn, amount, currency, bankName,
      bankAccountType, bankAccountNumber, bankAccountHolderName,
      idType, idNumber, webhookUrl,
    }) => {
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
          content: [{
            type: 'text',
            text: JSON.stringify(
              { error: `No exchange rates available for USD → COP via ${bankName}` },
              null, 2,
            ),
          }],
        };
      }

      const orderResult = await clients.swap.bankTransfer.create({
        rateSig: rate.sig,
        toMedium: bankName,
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
      });

      const result = {
        order: {
          id: orderResult.order.id,
          fromAmount: orderResult.order.fromAmount,
          toAmount: orderResult.order.toAmount,
          status: orderResult.order.status,
        },
        rate: { ratio: rate.ratio, fee: rate.fee },
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
