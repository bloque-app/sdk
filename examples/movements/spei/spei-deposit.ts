import { SDK } from '../../../packages/sdk/src/index';

/** SPEI pay-in: MXN/2 → MXNB/2 in a Bloque account. */
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
const amountSrc = process.env.AMOUNT_SRC ?? '100000'; // MXN 1,000.00
const destinationUrn =
  process.env.DEPOSIT_ACCOUNT_URN ??
  'did:bloque:account:virtual:mxn-destination';

const { rates } = await user.swap.findRates({
  fromAsset: 'MXN/2',
  toAsset: 'MXNB/2',
  fromMediums: ['spei'],
  toMediums: ['kusama'],
  amountSrc,
});

if (!rates[0]) throw new Error('No SPEI deposit rate available.');

const result = await user.swap.spei.createDeposit(
  {
    rateSig: rates[0].sig,
    amountSrc,
    depositInformation: {
      urn: destinationUrn,
      payerName: process.env.PAYER_NAME ?? 'María López',
      payerDocumentNumber: process.env.PAYER_RFC,
    },
  },
  { idempotencyKey: `spei-deposit-${destinationUrn}-${amountSrc}` },
);

const how = result.execution?.result.how;
if (how?.type !== 'SPEI_DEPOSIT') {
  throw new Error(`Expected SPEI_DEPOSIT, received ${how?.type ?? 'none'}.`);
}

console.log('Send the SPEI transfer:', {
  clabe: how.clabe,
  amount: how.amount,
  currency: how.currency,
  reference: how.reference,
  expiresAt: how.expiresAt,
  orderId: result.order.id,
});
