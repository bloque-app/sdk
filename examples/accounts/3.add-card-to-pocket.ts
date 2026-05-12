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

const virtual = await user.accounts.virtual.create({}, {
  waitLedger: true,
  idempotencyKey: 'f7a3b89e-6d3f-4e9e-8b7f-a1c4d2e5f901',
});

const card = await user.accounts.card.create(
  {
    ledgerId: virtual.ledgerId,
    name: 'My Card',
  },
  { waitLedger: true, idempotencyKey: 'f7a3b89e-6d3f-4e9e-8b7f-a1c4d2e5f901' },
);
