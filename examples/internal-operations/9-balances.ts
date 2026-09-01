import { SDK } from '../../packages/sdk/src/index';

/**
 * Check balances.
 *
 * - `accounts.balance(urn)`: current/pending/in/out for one specific account.
 * - `accounts.balances()`: aggregated balances across all of the holder's
 *   accounts, grouped by asset.
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
  { waitLedger: true, idempotencyKey: 'balances-example-main-pocket' },
);

// Balance for one account, by asset
const balance = await user.accounts.balance(pocket.urn);
for (const [asset, b] of Object.entries(balance)) {
  console.log(
    `${asset}: current=${b.current} pending=${b.pending} in=${b.in} out=${b.out}`,
  );
}

// Aggregated balance across all accounts the holder owns
const balances = await user.accounts.balances();
console.log('DUSD/6 across all accounts:', balances['DUSD/6']?.current);

// Aggregated balance restricted to a subset of accounts
const scoped = await user.accounts.balances({ accountUrns: [pocket.urn] });
console.log('Scoped balances:', scoped);
