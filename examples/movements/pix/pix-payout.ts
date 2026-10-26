import {
  type PixKeyType,
  SDK,
  withApproval,
} from '../../../packages/sdk/src/index';

/** PIX payout: BRLB/2 on Kusama → BRL/2 to a PIX key. */
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
const amountSrc = process.env.AMOUNT_SRC ?? '10000'; // BRLB 100.00
const pixKeyType = (process.env.PIX_KEY_TYPE ?? 'EMAIL') as PixKeyType;
const sourceAccountUrn = process.env.SOURCE_ACCOUNT_URN;
if (!sourceAccountUrn) throw new Error('SOURCE_ACCOUNT_URN is required.');

const { rates } = await user.swap.findRates({
  fromAsset: 'BRLB/2',
  toAsset: 'BRL/2',
  fromMediums: ['kusama'],
  toMediums: ['pix'],
  amountSrc,
});

if (!rates[0]) throw new Error('No PIX payout rate available.');
const rate = rates[0];

// If the account owner must approve this with their passkey, withApproval
// shares the link, waits for the approval and repeats the call once.
const result = await withApproval(
  (approval) =>
    user.swap.pix.create(
      {
        rateSig: rate.sig,
        amountSrc,
        depositInformation: {
          pixKeyType,
          pixKeyValue: process.env.PIX_KEY_VALUE ?? 'ana@example.com',
          beneficiaryName: process.env.BENEFICIARY_NAME,
        },
        args: { sourceAccountUrn },
      },
      { idempotencyKey: `pix-payout-${rate.sig}-${amountSrc}`, approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);

console.log('PIX payout created:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
