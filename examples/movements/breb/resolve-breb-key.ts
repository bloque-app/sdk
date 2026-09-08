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

const resolution = await user.accounts.breb.resolveKey({
  keyType:
    (process.env.BREB_KEY_TYPE as
      | 'ID'
      | 'PHONE'
      | 'EMAIL'
      | 'ALPHA'
      | 'BCODE') ?? 'PHONE',
  key: process.env.BREB_KEY ?? '3015550127',
});

if (resolution.error || !resolution.data) {
  throw new Error(resolution.error?.message ?? 'Failed to resolve BRE-B key');
}

console.log('BRE-B key resolved:', {
  resolutionId: resolution.data.resolutionId,
  key: resolution.data.key,
  owner: resolution.data.owner,
  participant: resolution.data.participant,
  account: resolution.data.account,
  receptorNode: resolution.data.receptorNode,
  resolvedAt: resolution.data.resolvedAt,
  expiresAt: resolution.data.expiresAt,
});
