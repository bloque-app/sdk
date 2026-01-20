import { SDK } from '../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
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

const result = await user.swap.pse.create({
  rateSig: rates.rates[0]?.sig,
  toMedium: 'kreivo',
  amountSrc: '1000000',
  depositInformation: { ledgerAccountId: '0x123...' },
});

console.log('PSE Top-up order created:', result.order);
