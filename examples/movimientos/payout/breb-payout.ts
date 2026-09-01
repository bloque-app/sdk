import { SDK } from '../../../packages/sdk/src/index';

/**
 * BRE-B payout: DUSD on Kusama → COP, sent to any BRE-B key.
 *
 * The recipient is identified purely by their BRE-B key
 * (`depositInformation.destinationKey`) — independent of
 * `args.sourceAccountUrn`, which only identifies the account being debited.
 * No key resolution step is required before calling `create()`.
 *
 * For the reverse direction (COP deposit → DUSD credit), see
 * examples/movimientos/payin/breb-deposit-onramp.ts.
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

const amountSrc = process.env.AMOUNT_SRC ?? '20000000';

const rates = await user.swap.findRates({
  fromAsset: 'DUSD/6',
  toAsset: 'COP/2',
  fromMediums: ['kusama'],
  toMediums: ['breb'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No BRE-B payout rates available.');
}

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:kusama-user-001';

const result = await user.swap.breb.create(
  {
    rateSig: rates.rates[0]!.sig,
    amountSrc,
    depositInformation: {
      resolutionId: `breb-payout-${amountSrc}`,
      destinationKey: {
        keyValue: process.env.BREB_KEY_VALUE ?? '@JAR1234',
        keyType: 'ALPHA',
        displayName: 'Jane Doe',
      },
    },
    args: { sourceAccountUrn },
  },
  { idempotencyKey: `breb-payout-${amountSrc}` },
);

console.log('BRE-B payout order:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
