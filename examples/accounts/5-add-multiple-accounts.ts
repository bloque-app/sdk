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

const virtual = await user.accounts.virtual.create({}, { waitLedger: true });

// Receive funds in polygon
const polygon = await user.accounts.polygon.create(
  {
    ledgerId: virtual.ledgerId,
  },
  { waitLedger: true },
);

// Use it in your own card
const card = await user.accounts.card.create(
  {
    ledgerId: virtual.ledgerId,
  },
  { waitLedger: true },
);

console.log('Polygon account created:', polygon.urn);
console.log('Card account created:', card.urn);
