import { SDK } from '../../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: 'sandbox',
  platform: 'node',
});

const user = await bloque.connect('nestor');

const rates = await user.swap.findRates({
  fromAsset: 'COP/2',
  toAsset: 'DUSD/6',
  fromMediums: ['pse'],
  toMediums: ['kusama'],
  amountSrc: '1000000',
});
console.log('Available swap rates:', rates.rates[0]);

if (rates.rates.length === 0) {
  throw new Error(
    'No swap rates available for the specified assets and mediums.',
  );
}

const banks = await user.swap.pse.banks();
console.log('Available PSE banks:', banks.banks);

const result = await user.swap.pse.create({
  rateSig: rates.rates[0]?.sig,
  toMedium: 'kusama',
  amountSrc: '1000000',
  depositInformation: {
    urn: 'did:bloque:account:card:usr-xxx:crd-xxx',
  },
  args: {
    bankCode: banks.banks[0]?.code,
    userType: 0, // 0 = natural person, 1 = legal entity
    customerEmail: 'user@example.com',
    userLegalIdType: 'CC',
    userLegalId: '123456789',
    customerData: {
      fullName: 'John Doe',
      phoneNumber: '+573001234567',
    },
    // Required for every PSE payment (Wompi and Cobre alike) — the bank
    // redirects the customer here once the flow completes.
    redirectUrl: 'https://your-app.com/payment-status',
  },
});

const how = result.execution?.result.how;
const redirectUrl = how && 'url' in how ? how.url : undefined;
console.log('PSE Top-up order created, redirect to:', redirectUrl);
