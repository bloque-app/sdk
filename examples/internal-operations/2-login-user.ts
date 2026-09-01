import { SDK } from '../../packages/sdk/dist';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const session = await bloque.connect('@nestor');

console.log('logged-user in user:', session.urn);
