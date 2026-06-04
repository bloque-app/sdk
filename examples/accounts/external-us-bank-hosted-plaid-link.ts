import { SDK } from '../../packages/sdk/src';

const bloque = new SDK({
  origin: 'ktg',
  auth: {
    type: 'originKey',
    originKey: 'sk_live_your_origin_key_here',
  },
  baseUrl: 'https://api.bloque.sh',
  platform: 'node',
});

const user = await bloque.connect('cus_kr7rr5bfzr6igm7');

const bank = await user.accounts.list({
  medium: 'external-us-bank',
  urn: 'did:bloque:account:external-us-bank:5499a525-b415-4861-b978-0f5afd605ec8',
});

console.log(JSON.stringify(bank, null, 2));
