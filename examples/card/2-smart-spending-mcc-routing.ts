// Smart Spending: MCC-Based Routing
//
// The fun part! Route transactions to different pockets based on
// where the purchase happens. Buy groceries? Debits from your food pocket.
// Random online purchase? Falls through to your main wallet.
//
// How it works:
//   1. A purchase comes in with a Merchant Category Code (MCC)
//   2. The system checks each pocket in priority_mcc order
//   3. If the MCC matches a pocket's whitelist → debit from that pocket
//   4. If no match → try the next pocket in line
//   5. Pockets without a whitelist entry are "catch-all" (accept any MCC)

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

// Step 1: Create a food pocket — only for groceries and restaurants
const foodPocket = await user.accounts.virtual.create(
  { name: 'Food Budget' },
  { waitLedger: true },
);
console.log('Food pocket:', foodPocket.urn);

// Step 2: Create a main wallet — catches everything else
const mainWallet = await user.accounts.virtual.create(
  { name: 'Main Wallet' },
  { waitLedger: true },
);
console.log('Main wallet:', mainWallet.urn);

// Step 3: Create a card with smart spending control
const card = await user.accounts.card.create(
  {
    name: 'Smart Card',
    ledgerId: mainWallet.ledgerId,
    metadata: {
      spending_control: 'smart',
      preferred_asset: 'DUSD/6',
      default_asset: 'DUSD/6',

      // Which MCCs each pocket accepts
      // Only pockets with specific categories need an entry here.
      // The main wallet has NO entry → it's the catch-all.
      mcc_whitelist: {
        [foodPocket.urn]: [
          '5411', // Grocery stores
          '5812', // Restaurants
          '5814', // Fast food
        ],
      },

      // Priority order: check food pocket first, then main wallet
      // If the food pocket doesn't match the MCC (or is out of funds),
      // the transaction falls through to the main wallet.
      priority_mcc: [foodPocket.urn, mainWallet.urn],
    },
  },
  { waitLedger: true },
);

console.log('Smart card created:', card.urn);
console.log('Routing: food purchases → food pocket, everything else → main wallet');
