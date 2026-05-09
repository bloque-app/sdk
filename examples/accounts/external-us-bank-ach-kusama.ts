import { SDK } from "../../packages/sdk/src/index";

/**
 * External US bank (Brale / Plaid) → Kusama (DUSD) — end-to-end flow the
 * integrator controls in the client, plus what runs automatically on the server.
 *
 * 1. Create a `virtual` pocket and an `external-us-bank` medium account.
 * 2. Use `details.linkToken` to open Plaid Link; on success, call
 *    `exchangePublicToken` with the `public_token` (not shown here).
 * 3. Initiate an ACH debit via Brale (dashboard, partner API, or your product).
 *    There is not always a single Bloque SDK call for this step.
 * 4. When Brale sends `transfer.completed` to Bloque, the mediums service
 *    creates a swap order (USD/2 → DUSD/6) and runs the graph.
 * 5. Poll `swap.listOrders` or use your own webhooks to observe completion.
 */
const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: "originKey",
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: "sandbox",
  platform: "node",
});

const user = await bloque.connect("nestor");

const virtual = await user.accounts.virtual.create({}, { waitLedger: true });

const bank = await user.accounts.externalUsBank.create({
  holderUrn: user.urn,
  ledgerId: virtual.ledgerId,
  label: "ACH on-ramp",
});

console.log("Plaid link_token (pass to Plaid Link):", bank.details.linkToken);

// const linked = await user.accounts.externalUsBank.exchangePublicToken({
//   urn: bank.urn,
//   publicToken: "<public_token from Plaid Link>",
// });
// console.log("Linked bank:", linked.details.braleAddressId);

const quote = await user.swap.findRates({
  fromAsset: "USD/2",
  toAsset: "DUSD/6",
  fromMediums: ["external-us-bank"],
  toMediums: ["kusama"],
  amountSrc: "10000",
});

console.log(
  "Indicative rate only — the live order is opened after ACH settles:",
  quote.rates[0],
);

const recent = await user.swap.listOrders({ status: "pending" });
console.log("Swap orders for this user:", recent.orders);
