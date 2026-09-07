import { SDK } from '../../../packages/sdk/src';

/**
 * External US bank (Brale / Plaid) → USDC on Base — proactive ACH pull.
 *
 * Same link flow as external-us-bank-ach-kusama.ts. Once `linkStatus ===
 * 'active'`, call `pull()` with `chain: 'base'` and a destination 0x. The
 * mediums service initiates a Brale `ach_debit` and delivers USDC on Base
 * to that wallet — no ledger account is required.
 *
 * Track progress via webhooks (`swap.order.*`, `transfer.*`) or by polling
 * `user.swap.listOrders`.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: 'sandbox',
  platform: 'node',
});

const user = await bloque.connect('@usuario2');

const bankUrn =
  process.env.BANK_URN ??
  'did:bloque:account:external-us-bank:49b9b8bd-0eb5-43ee-b86c-21bc60a9a49c';
const walletAddress =
  process.env.WALLET_ADDRESS ?? '0x1234567890abcdef1234567890abcdef12345678';

const quote = await user.swap.findRates({
  fromAsset: 'USD/2',
  toAsset: 'USDC/6',
  fromMediums: ['external-us-bank'],
  toMediums: ['base'],
  amountSrc: '10000',
});
console.log('Indicative rate:', quote.rates[0]);

const order = await user.accounts.externalUsBank.pull({
  urn: bankUrn,
  amount: '10',
  chain: 'base',
  walletAddress,
});

console.log(JSON.stringify(order, null, 2));
