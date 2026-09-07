import { SDK } from '../../../packages/sdk/src/index';

/**
 * RTP cash-out: USDC on Base → USD to a US bank account via RTP.
 *
 * Edge: base:rtp[usdc:usd]
 * Template: BASE_TO_RTP
 *
 * depositInformation carries the destination US bank details (same shape as
 * Kusama RTP). args.sourceAccountUrn is the EVM/Polygon account that received
 * USDC on Base; args.txHash is the incoming transfer hash.
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

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:polygon:abc123';
const txHash = process.env.TX_HASH ?? '0xabc';

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
    args: { sourceAccountUrn, txHash },
  },
  { idempotencyKey: `rtp-payout-base-${amountSrc}` },
);

console.log('Base RTP payout order:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
