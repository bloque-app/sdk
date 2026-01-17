import { SDK } from '../packages/sdk/src/index.ts';

const bloque = new SDK({
  origin: 'your-origin',
  auth: {
    type: 'apiKey',
    apiKey: process.env.BLOQUE_API_KEY!,
  },
});

async function setup() {
  const session = await bloque.register('@angel', {
    type: 'individual',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
    },
  });

  const mainPocket = await session.accounts.virtual.create(
    {
      metadata: {
        purpose: 'testing',
      },
    },
    { waitLedger: true },
  );

  const card = await session.accounts.card.create({
    name: 'Main Card',
    ledgerId: mainPocket.ledgerId,
  });

  const polygon = await session.accounts.polygon.create({
    ledgerId: mainPocket.ledgerId,
  });

  const bancolombia = await session.accounts.bancolombia.create({
    ledgerId: mainPocket.ledgerId,
  });

  const movements = await session.accounts.movements({
    asset: 'COPM/2',
    urn: mainPocket.urn,
  });
}
