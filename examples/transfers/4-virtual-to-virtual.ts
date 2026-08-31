// Minimal virtual-account-to-virtual-account transfer (e.g. two pockets
// belonging to the same holder, or to two different holders).

import { SDK } from '../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

const from = await user.accounts.virtual.create(
  { name: 'From' },
  { waitLedger: true, idempotencyKey: 'virtual-to-virtual-from' },
);

const to = await user.accounts.virtual.create(
  { name: 'To' },
  { waitLedger: true, idempotencyKey: 'virtual-to-virtual-to' },
);

const result = await user.accounts.transfer(
  {
    sourceUrn: from.urn,
    destinationUrn: to.urn,
    amount: '15000000', // 15 DUSD
    asset: 'DUSD/6',
  },
  { idempotencyKey: 'virtual-to-virtual-transfer' },
);

console.log('Transfer queued:', result.queueId, result.status);
