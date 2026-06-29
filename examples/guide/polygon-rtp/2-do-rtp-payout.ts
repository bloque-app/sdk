import { SDK } from '../../../packages/sdk/src/index';

/**
 * Step 2 of the Polygon → RTP guide.
 *
 * Connects as the identity registered in step 1 and cashes out via RTP:
 * DUSD on Kusama → USD to a US bank account.
 *
 * Edge: kusama:rtp[dusd:usd]
 *
 * Prerequisites:
 * - ORIGIN, ORIGIN_KEY, USER_HANDLE env vars (see examples/accounts/.env.example)
 * - SOURCE_ACCOUNT_URN: Kusama account URN to debit DUSD from
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: (process.env.MODE as 'production' | 'sandbox') ?? 'sandbox',
  platform: 'node',
});

const handle = process.env.USER_HANDLE ?? 'nestor';

const user = await bloque.connect(handle);

console.log('Connected as:', user.urn);

// RTP cash-out: DUSD on Kusama → USD to a US bank account.
const amountSrc = process.env.AMOUNT_SRC ?? '20000000';

const rates = await user.swap.findRates({
  fromAsset: 'DUSD/6',
  toAsset: 'USD/2',
  fromMediums: ['kusama'],
  toMediums: ['rtp'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No RTP payout rates available.');
}

console.log('Best rate:', rates.rates[0]);

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:kusama-user-001';

const result = await user.swap.rtp.create(
  {
    rateSig: rates.rates[0]!.sig,
    amountSrc,
    depositInformation: {
      owner: process.env.RTP_OWNER ?? 'Jane Doe',
      accountNumber: process.env.RTP_ACCOUNT_NUMBER ?? '1234567890',
      routingNumber: process.env.RTP_ROUTING_NUMBER ?? '063108680',
      accountType:
        (process.env.RTP_ACCOUNT_TYPE as 'checking' | 'savings') ?? 'checking',
      bankName: process.env.RTP_BANK_NAME ?? 'Example Bank',
    },
    args: { sourceAccountUrn },
  },
  { idempotencyKey: `rtp-payout-${handle}-${amountSrc}` },
);

console.log('RTP payout order:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
