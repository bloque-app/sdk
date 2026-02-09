// Transfer Between Accounts
//
// Move funds from one account to another. Works across any account types:
// virtual → virtual, virtual → card, card → polygon, you name it.
//
// Amounts are strings (not numbers!) to preserve precision.
// The asset format is "SYMBOL/DECIMALS", e.g. "DUSD/6" means
// 6 decimal places — so "10000000" = 10.000000 DUSD (10 dollars).

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

// Setup: create two pockets to move money between
const savings = await user.accounts.virtual.create(
  { name: 'Savings' },
  { waitLedger: true },
);

const spending = await user.accounts.virtual.create(
  { name: 'Spending' },
  { waitLedger: true },
);

// Transfer 50 DUSD from savings to spending
// 50 DUSD = 50 * 10^6 = "50000000"
const result = await user.accounts.transfer({
  sourceUrn: savings.urn,
  destinationUrn: spending.urn,
  amount: '50000000',
  asset: 'DUSD/6',
  metadata: {
    note: 'Weekly allowance',
  },
});

console.log('Transfer queued:', result.queueId);
console.log('Status:', result.status);
console.log('Message:', result.message);

// You can also transfer to a card account
const card = await user.accounts.card.create(
  {
    name: 'My Card',
    ledgerId: spending.ledgerId,
  },
  { waitLedger: true },
);

const topUp = await user.accounts.transfer({
  sourceUrn: savings.urn,
  destinationUrn: card.urn,
  amount: '25000000', // 25 DUSD
  asset: 'DUSD/6',
  metadata: {
    note: 'Card top-up',
  },
});

console.log('Card top-up queued:', topUp.queueId);
