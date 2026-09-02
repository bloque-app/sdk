import type { SupportedBank } from '../../../packages/sdk/src/index';
import { SDK } from '../../../packages/sdk/src/index';

/**
 * Payout to any Colombian bank account: DUSD on Kusama → COP.
 *
 * `swap.bankTransfer` targets one destination bank per call, selected via
 * `toMedium`. This example uses `banco_de_bogota`, but the exact same call
 * works for any bank in the `SupportedBank` union
 * (`packages/swap/src/bank-transfer/types.ts`) — among ~50 others:
 * `bancolombia`, `banco_davivienda`, `banco_bbva_colombia`, `nequi`,
 * `daviplata`, `mibanco`, `lulo_bank`, `nubank`...
 *
 * There is no `banks()` endpoint to list them at runtime (unlike
 * `swap.pse.banks()`) — the supported set is the static `SupportedBank`
 * type. To check whether a *specific* bank has an active rate right now,
 * call `findRates` with that bank as `toMediums` (see below) — an empty
 * `rates` array means that bank isn't payable out to at the moment.
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

const amountSrc = process.env.AMOUNT_SRC ?? '100000000';

// Swap this for any other `SupportedBank` value to pay out elsewhere —
// the rest of the call stays identical.
const toMedium =
  (process.env.DESTINATION_BANK as SupportedBank) ?? 'banco_de_bogota';

// Availability check: an empty `rates` array means this bank has no active
// rate right now, not that the bank is unsupported.
const rates = await user.swap.findRates({
  fromAsset: 'DUSD/6',
  toAsset: 'COP/2',
  fromMediums: ['kusama'],
  toMediums: [toMedium],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error(`No payout rates available for ${toMedium} right now.`);
}

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:kusama-user-001';

const result = await user.swap.bankTransfer.create(
  {
    rateSig: rates.rates[0]!.sig,
    toMedium,
    amountSrc,
    depositInformation: {
      bankAccountType: 'savings',
      bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '5740088718',
      bankAccountHolderName:
        process.env.BANK_ACCOUNT_HOLDER_NAME ?? 'Juan Pérez',
      bankAccountHolderIdentificationType: 'CC',
      bankAccountHolderIdentificationValue:
        process.env.BANK_ACCOUNT_HOLDER_ID ?? '1234567890',
    },
    args: { sourceAccountUrn },
  },
  { idempotencyKey: `${toMedium}-payout-${amountSrc}` },
);

console.log('Colombian bank payout order:', {
  bank: toMedium,
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
