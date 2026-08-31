import { SDK } from '../../packages/sdk/src/index';

/**
 * Query movements (transaction history).
 *
 * - `accounts.movements(params)`: history for ONE account (requires `urn`).
 * - `accounts.transactions(params)`: history across ALL of the holder's
 *   accounts at once — no `urn` needed.
 *
 * Both return a paged result: `{ data, pageSize, hasMore, next }`.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

const pocket = await user.accounts.virtual.create(
  { name: 'Main' },
  { waitLedger: true, idempotencyKey: 'movements-example-main-pocket' },
);

// Movements for a single account
const page = await user.accounts.movements({
  urn: pocket.urn,
  asset: 'DUSD/6',
  limit: 20,
  direction: 'in',
});

for (const movement of page.data) {
  console.log(
    movement.type,
    movement.amount,
    movement.status,
    movement.createdAt,
  );
}

// Walk subsequent pages
let cursor = page;
while (cursor.hasMore && cursor.next) {
  cursor = await user.accounts.movements({
    urn: pocket.urn,
    asset: 'DUSD/6',
    next: cursor.next,
  });
}

// Only settled (main) or only pending movements
const pending = await user.accounts.movements({
  urn: pocket.urn,
  asset: 'DUSD/6',
  pocket: 'pending',
});
console.log('Pending movements:', pending.data.length);

// Across every account the holder owns, no urn needed
const everything = await user.accounts.transactions({
  asset: 'DUSD/6',
  limit: 50,
});
console.log('Total recent transactions:', everything.data.length);
