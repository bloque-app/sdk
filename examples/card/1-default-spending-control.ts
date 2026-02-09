// Default Spending Control
//
// The simplest setup: one pocket, one card, all merchants accepted.
// This is what you get out of the box — no extra config needed.
// But you CAN customize the preferred asset and currency mapping.

import { SDK } from '../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

// Step 1: Create a pocket (virtual account) to hold funds
const pocket = await user.accounts.virtual.create({}, { waitLedger: true });
console.log('Pocket created:', pocket.urn);

// Step 2: Create a card linked to the pocket
// spending_control: 'default' is optional — it's the default behavior.
// The card will accept purchases at ANY merchant and debit from this pocket.
const card = await user.accounts.card.create(
  {
    name: 'My Everyday Card',
    ledgerId: pocket.ledgerId,
    metadata: {
      spending_control: 'default',
      preferred_asset: 'DUSD/6',
      default_asset: 'DUSD/6',
    },
  },
  { waitLedger: true },
);

console.log('Card created:', card.urn);
console.log('Card status:', card.status);
console.log('Linked to pocket:', pocket.urn);
