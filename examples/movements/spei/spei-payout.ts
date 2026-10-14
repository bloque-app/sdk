import { SDK } from '../../../packages/sdk/src/index';

/** SPEI payout: MXNB/2 on Kusama → MXN/2 to an 18-digit CLABE. */
const origin = process.env.ORIGIN;
const originKey = process.env.ORIGIN_KEY;
if (!origin || !originKey)
  throw new Error('ORIGIN and ORIGIN_KEY are required.');

const bloque = new SDK({
  origin,
  auth: { type: 'originKey', originKey },
  mode: 'sandbox',
  platform: 'node',
});

const user = await bloque.connect(process.env.USER_HANDLE ?? 'mexico-user');
const amountSrc = process.env.AMOUNT_SRC ?? '100000'; // MXNB 1,000.00

const { rates } = await user.swap.findRates({
  fromAsset: 'MXNB/2',
  toAsset: 'MXN/2',
  fromMediums: ['kusama'],
  toMediums: ['spei'],
  amountSrc,
});

if (!rates[0]) throw new Error('No SPEI payout rate available.');

const result = await user.swap.spei.create(
  {
    rateSig: rates[0].sig,
    amountSrc,
    depositInformation: {
      clabe: process.env.BENEFICIARY_CLABE ?? '646180157034181180',
      beneficiaryName: process.env.BENEFICIARY_NAME ?? 'José Pérez',
      rfc: process.env.BENEFICIARY_RFC,
    },
  },
  { idempotencyKey: `spei-payout-${rates[0].sig}-${amountSrc}` },
);

console.log('SPEI payout created:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
