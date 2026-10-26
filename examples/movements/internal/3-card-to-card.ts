// Transfer funds directly between two cards.
//
// Same `accounts.transfer()` call as any other internal transfer — the
// medium of source/destination doesn't matter to this endpoint.

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

const cardA = await user.accounts.card.create(
  { name: 'Card A' },
  { waitLedger: true, idempotencyKey: 'card-to-card-a' },
);

const cardB = await user.accounts.card.create(
  { name: 'Card B' },
  { waitLedger: true, idempotencyKey: 'card-to-card-b' },
);

// If the account owner must approve this with their passkey, withApproval
// shares the link, waits for the approval and repeats the call once.
const result = await withApproval(
  (approval) =>
    user.accounts.transfer(
      {
        sourceUrn: cardA.urn,
        destinationUrn: cardB.urn,
        amount: '10000000', // 10 DUSD
        asset: 'DUSD/6',
        metadata: { note: 'Split between cards' },
      },
      { idempotencyKey: 'card-to-card-transfer', approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);

console.log('Transfer queued:', result.queueId, result.status);
