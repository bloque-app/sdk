import { SDK } from '../../packages/sdk/src/index';

/**
 * External US bank on-ramp: ACH pull USD → DUSD on Kusama.
 *
 * Edge: external-us-bank:kusama[usd:dusd]
 * Template: EXTERNAL_US_BANK_TO_KUSAMA
 *
 * Prerequisites:
 * - A linked external-us-bank account (see examples/accounts/external-us-bank-*)
 * - The Kusama ledger account id to credit after teleport
 *
 * This uses swap.externalUsBank.create (order graph). For a direct mediums pull
 * without going through findRates, see accounts.externalUsBank.pull().
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

const user = await bloque.connect(process.env.USER_HANDLE ?? 'nestor');

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ??
  'did:bloque:account:external-us-bank:abc123';
const ledgerAccountId = process.env.LEDGER_ACCOUNT_ID ?? 'ledger-user-001';
const amountSrc = process.env.AMOUNT_SRC ?? '10000';

const rates = await user.swap.findRates({
  fromAsset: 'USD/2',
  toAsset: 'DUSD/6',
  fromMediums: ['external-us-bank'],
  toMediums: ['kusama'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No external US bank on-ramp rates available.');
}

console.log('Best rate:', rates.rates[0]);

const result = await user.swap.externalUsBank.create(
  {
    rateSig: rates.rates[0]!.sig,
    amountSrc,
    depositInformation: { ledgerAccountId },
    args: { sourceAccountUrn },
  },
  { idempotencyKey: `external-us-bank-onramp-${amountSrc}` },
);

console.log('External US bank on-ramp order:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
