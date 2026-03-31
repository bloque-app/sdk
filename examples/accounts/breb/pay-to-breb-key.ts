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

const resolution = await user.accounts.breb.resolveKey({
  keyType: 'PHONE',
  key: '3015550127',
});
console.log('BREB resolve key response 3015550127:', resolution);

if (resolution.error || !resolution.data) {
  throw new Error(resolution.error?.message ?? 'Failed to resolve BRE-B key');
}

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

const result = await user.swap.breb.create({
  rateSig: rates.rates[0].sig,
  amountSrc,
  depositInformation: {
    resolutionId: resolution.data.resolutionId,
  },
  args: {
    sourceAccountUrn,
  },
});

console.log('BREB payment created:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  execution: result.execution,
});
