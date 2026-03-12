import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';

export function registerSwapTools(server: McpServer, clients: BloqueClients) {
  server.tool(
    'find_rates',
    'Find exchange rates between two assets. Returns rates with fees, limits, and a rateSig needed to create swap orders. Use this before topup_via_pse or cashout_to_bank.',
    {
      fromAsset: z.string(),
      toAsset: z.string(),
      fromMediums: z.array(z.string()),
      toMediums: z.array(z.string()),
      amountSrc: z.string().optional(),
      amountDst: z.string().optional(),
    },
    async (params) => {
      const result = await clients.swap.findRates(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'list_pse_banks',
    'List Colombian banks available for PSE payments. Returns bank code and name.',
    {},
    async () => {
      const result = await clients.swap.pse.banks();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'create_pse_order',
    "Low-level: create a PSE swap order to convert COP into DUSD. For a simpler flow, use 'topup_via_pse' workflow.",
    {
      rateSig: z.string(),
      toMedium: z.string(),
      amountSrc: z.string().optional(),
      amountDst: z.string().optional(),
      depositUrn: z.string(),
      bankCode: z.string(),
      userType: z.union([z.literal(0), z.literal(1)]),
      customerEmail: z.string(),
      userLegalIdType: z.enum(['CC', 'NIT', 'CE']),
      userLegalId: z.string(),
      fullName: z.string(),
      phoneNumber: z.string().optional(),
      webhookUrl: z.string().optional(),
    },
    async ({
      rateSig, toMedium, amountSrc, amountDst, depositUrn,
      bankCode, userType, customerEmail, userLegalIdType,
      userLegalId, fullName, phoneNumber, webhookUrl,
    }) => {
      const result = await clients.swap.pse.create({
        rateSig,
        toMedium,
        webhookUrl,
        amountSrc,
        amountDst,
        depositInformation: { urn: depositUrn },
        args: {
          bankCode,
          userType,
          customerEmail,
          userLegalIdType,
          userLegalId,
          customerData: { fullName, phoneNumber: phoneNumber ?? '' },
        },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'create_bank_transfer_order',
    "Low-level: create a bank transfer order to cash out DUSD to COP. For a simpler flow, use 'cashout_to_bank' workflow.",
    {
      rateSig: z.string(),
      toMedium: z.string(),
      amountSrc: z.string().optional(),
      amountDst: z.string().optional(),
      sourceAccountUrn: z.string(),
      bankAccountType: z.enum(['savings', 'checking']),
      bankAccountNumber: z.string(),
      bankAccountHolderName: z.string(),
      bankAccountHolderIdentificationType: z.enum(['CC', 'CE', 'NIT', 'PP']),
      bankAccountHolderIdentificationValue: z.string(),
      webhookUrl: z.string().optional(),
    },
    async ({
      rateSig, toMedium, amountSrc, amountDst, sourceAccountUrn,
      bankAccountType, bankAccountNumber, bankAccountHolderName,
      bankAccountHolderIdentificationType, bankAccountHolderIdentificationValue,
      webhookUrl,
    }) => {
      const result = await clients.swap.bankTransfer.create({
        rateSig,
        toMedium,
        webhookUrl,
        amountSrc,
        amountDst,
        depositInformation: {
          bankAccountType,
          bankAccountNumber,
          bankAccountHolderName,
          bankAccountHolderIdentificationType,
          bankAccountHolderIdentificationValue,
        },
        args: { sourceAccountUrn },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
