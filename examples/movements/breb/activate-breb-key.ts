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

const accountUrn =
  process.env.BREB_ACCOUNT_URN ?? 'did:bloque:account:breb:demo-account-id';

const { data, error } = await user.accounts.breb.activateKey({
  accountUrn,
});

console.log('BREB activate key response:', { data, error });

if (error || !data) {
  throw new Error(error?.message ?? 'Failed to activate BRE-B key');
}

console.log('BREB key activated:', {
  accountUrn: data.accountUrn,
  keyId: data.keyId,
  keyStatus: data.keyStatus,
  status: data.status,
});
