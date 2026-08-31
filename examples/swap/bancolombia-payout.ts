import { SDK } from '../../packages/sdk/src/index';

/**
 * Payout to a Colombian bank account (Bancolombia): DUSD on Kusama → COP.
 *
 * `swap.bankTransfer` supports any Colombian bank as the destination —
 * `toMedium: 'bancolombia'` targets Bancolombia specifically. Swap
 * `toMedium` for another supported bank (e.g. `banco_de_bogota`,
 * `banco_bbva_colombia`) to pay out elsewhere with the same call.
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

const rates = await user.swap.findRates({
  fromAsset: 'DUSD/6',
  toAsset: 'COP/2',
  fromMediums: ['kusama'],
  toMediums: ['bancolombia'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No Bancolombia payout rates available.');
}

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:kusama-user-001';

const result = await user.swap.bankTransfer.create(
  {
    rateSig: rates.rates[0]!.sig,
    toMedium: 'bancolombia',
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
  { idempotencyKey: `bancolombia-payout-${amountSrc}` },
);

console.log('Bancolombia payout order:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
