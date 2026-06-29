import { SDK } from '../../packages/sdk/src/index';

/**
 * BRE-B on-ramp: deposit COP via a one-time BRE-B key → receive DUSD on Kusama.
 *
 * Edge: breb:kusama[cop:dusd]
 * Template: brebDepositKusama
 *
 * After createDeposit with args, the order pauses with how.type === 'BREB_DEPOSIT'.
 * Show keyType/keyValue so the payer can send COP from their bank's BRE-B app.
 *
 * Partial payments: multiple transfers to the same key are summed. When
 * depositStatus === 'partial', show remainingAmount and keep the same keyValue.
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

const destinationUrn =
  process.env.DEPOSIT_ACCOUNT_URN ?? 'did:bloque:account:breb-user-001';
const amountSrc = process.env.AMOUNT_SRC ?? '20000000';

const rates = await user.swap.findRates({
  fromAsset: 'COP/2',
  toAsset: 'DUSD/6',
  fromMediums: ['breb'],
  toMediums: ['kusama'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No BRE-B on-ramp rates available.');
}

console.log('Best rate:', rates.rates[0]);

const result = await user.swap.breb.createDeposit(
  {
    rateSig: rates.rates[0]!.sig,
    amountSrc,
    depositInformation: { urn: destinationUrn },
    args: {},
  },
  { idempotencyKey: `breb-deposit-${amountSrc}` },
);

console.log('Order:', result.order.id, result.order.status);
console.log('Graph ID:', result.order.graphId);

const how = result.execution?.result.how;
if (how?.type === 'BREB_DEPOSIT') {
  console.log('Send COP via BRE-B:');
  console.log('  key:', how.keyType, how.keyValue);
  console.log('  required:', how.expectedAmount ?? how.amount, how.currency);
  console.log('  reference:', how.reference);
  if (how.depositStatus === 'partial') {
    console.log('  received:', how.receivedAmount);
    console.log('  remaining:', how.remainingAmount);
  }
} else {
  console.log('Execution:', result.execution);
}
