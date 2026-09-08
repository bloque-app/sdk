import { SDK } from '../../../packages/sdk/src/index';

/**
 * RTP cash-out: USDC on Base → USD to a US bank account via RTP.
 *
 * Edge: base:rtp[usdc:usd]
 * Template: BASE_TO_RTP
 *
 * depositInformation is the destination US bank. `args` is optional. Omit it
 * (or omit txHash) to pause: send native USDC to execution.how.address.
 * Pass args.txHash only when that transfer is already on chain.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: 'sandbox',
  platform: 'node',
});

const user = await bloque.connect(process.env.USER_HANDLE ?? 'nestor');

const amountSrc = process.env.AMOUNT_SRC ?? '100000000';

const rates = await user.swap.findRates({
  fromAsset: 'USDC/6',
  toAsset: 'USD/2',
  fromMediums: ['base'],
  toMediums: ['rtp'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No Base RTP payout rates available.');
}

console.log('Best rate:', rates.rates[0]);

const txHash = process.env.TX_HASH?.trim();

const result = await user.swap.rtp.create(
  {
    rateSig: rates.rates[0]!.sig,
    amountSrc,
    fromMedium: 'base',
    depositInformation: {
      owner: process.env.RTP_OWNER ?? 'Jane Doe',
      accountNumber: process.env.RTP_ACCOUNT_NUMBER ?? '1234567890',
      routingNumber: process.env.RTP_ROUTING_NUMBER ?? '063108680',
      accountType:
        (process.env.RTP_ACCOUNT_TYPE as 'checking' | 'savings') ?? 'checking',
      bankName: process.env.RTP_BANK_NAME ?? 'Example Bank',
    },
    ...(txHash ? { args: { txHash } } : {}),
  },
  { idempotencyKey: `rtp-payout-base-${amountSrc}` },
);

const how = result.execution?.result.how;
console.log('Base RTP payout order:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
  how,
});
