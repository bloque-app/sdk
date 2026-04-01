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

const { data, error } = await user.accounts.breb.deleteKey({
  accountUrn,
});

console.log('BREB delete key response:', { data, error });

if (error || !data) {
  throw new Error(error?.message ?? 'Failed to delete BRE-B key');
}

console.log('BREB key deleted:', {
  deleted: data.deleted,
  accountUrn: data.accountUrn,
  keyId: data.keyId,
  status: data.status,
});
