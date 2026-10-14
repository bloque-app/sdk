import { SDK } from '../../../packages/sdk/src/index';

/** PIX pay-in: BRL/2 → BRLB/2 in a Bloque account. */
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

const user = await bloque.connect(process.env.USER_HANDLE ?? 'brazil-user');
const amountSrc = process.env.AMOUNT_SRC ?? '10000'; // BRL 100.00
const destinationUrn =
  process.env.DEPOSIT_ACCOUNT_URN ??
  'did:bloque:account:virtual:brl-destination';

const { rates } = await user.swap.findRates({
  fromAsset: 'BRL/2',
  toAsset: 'BRLB/2',
  fromMediums: ['pix'],
  toMediums: ['kusama'],
  amountSrc,
});

if (!rates[0]) throw new Error('No PIX deposit rate available.');

const result = await user.swap.pix.createDeposit(
  {
    rateSig: rates[0].sig,
    amountSrc,
    depositInformation: {
      urn: destinationUrn,
      payerName: process.env.PAYER_NAME ?? 'Ana Silva',
      payerDocumentNumber: process.env.PAYER_DOCUMENT_NUMBER ?? '52998224725',
      payerDocumentType: 'CPF',
    },
  },
  { idempotencyKey: `pix-deposit-${destinationUrn}-${amountSrc}` },
);

const how = result.execution?.result.how;
if (how?.type !== 'PIX_DEPOSIT') {
  throw new Error(`Expected PIX_DEPOSIT, received ${how?.type ?? 'none'}.`);
}

console.log('Pay this PIX QR payload:', {
  qrCodePayload: how.qrCodePayload,
  amount: how.amount,
  currency: how.currency,
  reference: how.reference,
  expiresAt: how.expiresAt,
  orderId: result.order.id,
});
