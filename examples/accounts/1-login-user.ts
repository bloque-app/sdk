import { SDK } from '../../packages/sdk/dist';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const session = await bloque.connect('@nestor');

console.log('logged-user in user:', session.urn);
