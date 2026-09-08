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

const { data, error } = await user.accounts.breb.createKey({
  keyType: 'PHONE',
  key: process.env.BREB_KEY ?? '3015550184',
  displayName: process.env.BREB_DISPLAY_NAME ?? 'Camila Ortega',
  metadata: {
    source: 'demo',
  },
});

console.log('BREB create key response:', { data, error });

if (error || !data) {
  throw new Error(error?.message ?? 'Failed to create BRE-B key');
}

console.log('BREB key created:', {
  urn: data.urn,
  keyType: data.keyType,
  key: data.key,
  displayName: data.displayName,
  status: data.status,
  ledgerId: data.ledgerId,
});
