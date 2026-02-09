// Update Spending Controls
//
// Already have a card? You can upgrade it from default to smart,
// add new category pockets, or change the MCC routing — all via
// updateMetadata. No need to create a new card.

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

// Assume we already have a card with default spending control
const CARD_URN = 'urn:bloque:account:card:your-card-id';

// --- Example 1: Upgrade from default to smart ---

// First, create the pockets you want to route to
const foodPocket = await user.accounts.virtual.create(
  { name: 'Food' },
  { waitLedger: true },
);

const mainWallet = await user.accounts.virtual.create(
  { name: 'Main Wallet' },
  { waitLedger: true },
);

// Now flip the card to smart mode
const upgraded = await user.accounts.card.updateMetadata({
  urn: CARD_URN,
  metadata: {
    spending_control: 'smart',
    mcc_whitelist: {
      [foodPocket.urn]: ['5411', '5812', '5814'],
    },
    priority_mcc: [foodPocket.urn, mainWallet.urn],
  },
});

console.log('Upgraded to smart spending:', upgraded.urn);

// --- Example 2: Add a new category to an existing smart card ---

// Create a new pocket for entertainment
const entertainmentPocket = await user.accounts.virtual.create(
  { name: 'Entertainment' },
  { waitLedger: true },
);

// Update the card to include the new pocket
// Note: you send the FULL config, not a partial update
const updated = await user.accounts.card.updateMetadata({
  urn: CARD_URN,
  metadata: {
    spending_control: 'smart',
    mcc_whitelist: {
      [foodPocket.urn]: ['5411', '5812', '5814'],
      [entertainmentPocket.urn]: [
        '7832', // Movies
        '7841', // Streaming services
        '7911', // Entertainment events
      ],
    },
    // Entertainment goes before the main wallet in priority
    priority_mcc: [foodPocket.urn, entertainmentPocket.urn, mainWallet.urn],
  },
});

console.log('Added entertainment pocket:', updated.urn);
console.log('New routing:');
console.log('  Food MCCs → Food pocket');
console.log('  Entertainment MCCs → Entertainment pocket');
console.log('  Everything else → Main wallet');
