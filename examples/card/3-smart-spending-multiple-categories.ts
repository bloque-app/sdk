// Smart Spending: Multiple Category Pockets
//
// Level up your budgeting game! Create dedicated pockets for each
// spending category and let the card auto-route transactions.
//
// ┌─────────────────────────────────────────────────────┐
// │  Common MCC Categories (quick reference)            │
// ├──────────────┬──────────────────┬───────────────────┤
// │ Category     │ MCCs             │ What's included   │
// ├──────────────┼──────────────────┼───────────────────┤
// │ Food         │ 5411, 5812, 5814 │ Grocery, Dining   │
// │ Transport    │ 4111, 4121, 4131 │ Transit, Taxis    │
// │              │ 5541, 5542       │ Gas stations       │
// │ Entertainment│ 7832, 7841, 7911 │ Movies, Streaming │
// │ Health       │ 5912, 8011, 8021 │ Pharmacy, Doctors │
// │ Shopping     │ 5311, 5651, 5691 │ Dept stores, Wear │
// └──────────────┴──────────────────┴───────────────────┘

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

// Create category pockets
const foodPocket = await user.accounts.virtual.create(
  { name: 'Food' },
  { waitLedger: true },
);

const transportPocket = await user.accounts.virtual.create(
  { name: 'Transport' },
  { waitLedger: true },
);

// The general pocket has NO whitelist entry — it accepts any MCC.
// Think of it as the "everything else" bucket.
const generalPocket = await user.accounts.virtual.create(
  { name: 'General' },
  { waitLedger: true },
);

// Create the card with multi-category routing
const card = await user.accounts.card.create(
  {
    name: 'Budget Master',
    ledgerId: generalPocket.ledgerId,
    metadata: {
      spending_control: 'smart',
      preferred_asset: 'DUSD/6',
      default_asset: 'DUSD/6',

      mcc_whitelist: {
        [foodPocket.urn]: [
          '5411', // Grocery stores
          '5812', // Restaurants
          '5814', // Fast food
        ],
        [transportPocket.urn]: [
          '4111', // Local commuter transport
          '4121', // Taxis and rideshares
          '4131', // Bus lines
          '5541', // Service stations (gas)
          '5542', // Fuel dealers
        ],
        // generalPocket has NO entry here = catch-all
      },

      // Priority order matters!
      // The system walks this list top-to-bottom for each transaction.
      // Put specific pockets first, catch-all last.
      priority_mcc: [
        foodPocket.urn,
        transportPocket.urn,
        generalPocket.urn,
      ],
    },
  },
  { waitLedger: true },
);

console.log('Card created:', card.urn);
console.log('Pockets:');
console.log('  Food:', foodPocket.urn);
console.log('  Transport:', transportPocket.urn);
console.log('  General:', generalPocket.urn);

// What happens now:
//   Buy groceries (MCC 5411) → debits from Food pocket
//   Take an Uber (MCC 4121)  → debits from Transport pocket
//   Buy a book online         → debits from General pocket (catch-all)
//
// If a pocket runs out of funds, the transaction falls through
// to the next pocket in priority order. So if Food is empty,
// a grocery purchase would try Transport (no match), then General (catch-all).
