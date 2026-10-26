// Fund a card from a virtual account, and back.
//
// Both directions use the exact same `accounts.transfer()` call — only
// `sourceUrn`/`destinationUrn` swap. Amounts are strings; see
// 0-transfer-between-accounts.ts for the asset/decimals explanation.

import { SDK, withApproval } from '../../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

const spending = await user.accounts.virtual.create(
  { name: 'Spending' },
  { waitLedger: true, idempotencyKey: 'card-virtual-funding-spending' },
);

const card = await user.accounts.card.create(
  { name: 'My Card' },
  { waitLedger: true, idempotencyKey: 'card-virtual-funding-card' },
);

// virtual -> card: top up the card with 20 DUSD
// If the account owner must approve this with their passkey, withApproval
// shares the link, waits for the approval and repeats the call once.
const topUp = await withApproval(
  (approval) =>
    user.accounts.transfer(
      {
        sourceUrn: spending.urn,
        destinationUrn: card.urn,
        amount: '20000000',
        asset: 'DUSD/6',
        metadata: { note: 'Card top-up' },
      },
      { idempotencyKey: 'card-virtual-funding-topup', approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);
console.log('Top-up queued:', topUp.queueId, topUp.status);

// card -> virtual: pull unspent funds back
const pullback = await withApproval(
  (approval) =>
    user.accounts.transfer(
      {
        sourceUrn: card.urn,
        destinationUrn: spending.urn,
        amount: '5000000',
        asset: 'DUSD/6',
        metadata: { note: 'Card pull-back' },
      },
      { idempotencyKey: 'card-virtual-funding-pullback', approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);
console.log('Pull-back queued:', pullback.queueId, pullback.status);
