import { SDK } from '../../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect(process.env.USER_HANDLE ?? 'demo-user');

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:breb:demo-account-id';
const amountSrc = process.env.AMOUNT_SRC ?? '10000000';

const rates = await user.swap.findRates({
  fromAsset: 'COPM/2',
  toAsset: 'COP/2',
  fromMediums: ['kusama'],
  toMediums: ['breb'],
  amountSrc,
});
console.log('Swap rates result:', rates);

if (rates.rates.length === 0) {
  throw new Error(
    'No swap rates available for the specified assets and mediums.',
  );
}

const result = await user.swap.breb.create(
  {
    rateSig: rates.rates[0].sig,
    amountSrc,
    depositInformation: {
      // Any unique string -- used only to derive an idempotency key, not a
      // real key resolution.
      resolutionId: `payout-${crypto.randomUUID()}`,
      // ALPHA is the only key type currently supported for payouts.
      destinationKey: {
        keyValue: '@JAR1234',
        keyType: 'ALPHA',
      },
    },
    args: {
      // Your own account -- funds the payout, not the recipient.
      sourceAccountUrn,
    },
  },
  { idempotencyKey: 'f7a3b89e-6d3f-4e9e-8b7f-a1c4d2e5f901' },
);

console.log('BREB payment created:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  execution: result.execution,
});
