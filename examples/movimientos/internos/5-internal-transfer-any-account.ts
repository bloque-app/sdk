// `accounts.transfer()` doesn't care about medium — it moves a balance from
// any account URN to any other, as long as both are reachable ledger
// accounts. This lists the accounts you own and moves funds between the
// first two, whatever types they happen to be.

import { SDK } from '../../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

const { accounts } = await user.accounts.list();

const [source, destination] = accounts;
if (!source || !destination) {
  throw new Error('Need at least two accounts to demonstrate a transfer.');
}

console.log(`Transferring from a ${source.urn} to a ${destination.urn}`);

const result = await user.accounts.transfer(
  {
    sourceUrn: source.urn,
    destinationUrn: destination.urn,
    amount: '1000000', // 1 DUSD
    asset: 'DUSD/6',
  },
  { idempotencyKey: 'internal-transfer-any-account' },
);

console.log('Transfer queued:', result.queueId, result.status);
