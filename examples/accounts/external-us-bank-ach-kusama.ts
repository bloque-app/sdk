import { SDK } from '../../packages/sdk/src';

/**
 * External US bank (Brale / Plaid) → DUSD on Kusama — proactive ACH pull.
 *
 * Flow:
 *
 * 1. Create an `external-us-bank` medium account (linkable via Plaid).
 * 2. Finish linking — either the hosted page (`returnUrl`) or embedded
 *    Plaid Link + `exchangePublicToken()` (not shown end-to-end here).
 * 3. Once `linkStatus === 'active'`, call `pull()` with a USD decimal
 *    amount. The mediums service initiates a Brale `ach_debit` from the
 *    linked bank and runs the swap graph; DUSD on Kusama Asset Hub is
 *    teleported straight to the caller's Kreivo ledger account.
 * 4. Track progress via webhooks (`swap.order.*`, `transfer.*`) or by
 *    polling `user.swap.listOrders`.
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

// Step 1: create the linkable bank account.
// In production attach to an existing pocket via `ledgerId`.
const bank_urn =
  'did:bloque:account:external-us-bank:49b9b8bd-0eb5-43ee-b86c-21bc60a9a49c';

// Step 2 (out of band): drive Plaid Link with `bank.details.linkToken`
// in your frontend, then exchange the resulting `public_token`:
//
//   await user.accounts.externalUsBank.exchangePublicToken({
//     urn: bank.urn,
//     publicToken: '<public_token from Plaid Link>',
//   });
//
// Or pass `returnUrl` at create() time to use the Bloque-hosted page
// (server exchanges the token on redirect).

// Step 3: re-fetch and check the bank is actually linked before pulling.
// In production, refresh via `user.accounts.get(bank.urn)` after the
// Plaid Link flow completes — that returns a `MappedAccount` union, so
// you'll need a structural narrow (`'linkStatus' in account.details`)
// to access external-us-bank fields. For brevity, the example uses the
// typed `bank` reference straight from `create()` and assumes Plaid has
// already finished.
// if (bank.details.linkStatus !== 'active' || !bank.details.braleAddressId) {
//   console.log(
//     'Bank not active yet — current linkStatus:',
//     bank.details.linkStatus,
//   );
//   process.exit(0);
// }

// Optional: peek at a quote first to show the user an indicative amount.
const quote = await user.swap.findRates({
  fromAsset: 'USD/2',
  toAsset: 'DUSD/6',
  fromMediums: ['external-us-bank'],
  toMediums: ['kusama'],
  amountSrc: '10000', // $100.00 in USD/2 scaled units
});
console.log('Indicative rate:', quote.rates[0]);

// // Step 4: initiate the ACH pull. Amount is a USD decimal STRING (never a
// // number) — e.g. "100.00" not 100. The server scales it to USD/2 cents.
const order = await user.accounts.externalUsBank.pull({
  urn: bank_urn,
  amount: '10',
});

console.log(JSON.stringify(order, null, 2));

// console.log('Swap order created:');
// console.log('  orderSig :', order.orderSig);
// console.log('  graphId  :', order.graphId);
// console.log('  status   :', order.status);
// console.log('  requestId:', order.requestId);

// // Step 5: track to completion. Subscribe to `swap.order.*` webhooks and
// // match on order.orderSig — or poll:
// const recent = await user.swap.listOrders({ status: 'pending' });
// console.log(
//   'Pending swap orders for this user:',
//   recent.orders.map((o) => o.orderSig),
// );
