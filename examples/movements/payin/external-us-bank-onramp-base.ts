import { SDK } from '../../../packages/sdk/src/index';

/**
 * External US bank on-ramp: ACH pull USD → USDC on Base.
 *
 * Edge: external-us-bank:base[usd:usdc]
 * Template: EXTERNAL_US_BANK_TO_BASE
 *
 * Prerequisites:
 * - A linked external-us-bank account (see
 *   examples/internal-operations/external-us-bank-hosted-plaid-link.ts)
 * - A Base 0x to receive USDC (`WALLET_ADDRESS`)
 *
 * This uses swap.externalUsBank.create (order graph). For a direct mediums pull
 * without going through findRates, see accounts.externalUsBank.pull() with
 * chain: 'base'.
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
const walletAddress =
  process.env.WALLET_ADDRESS ?? '0x1234567890abcdef1234567890abcdef12345678';
const amountSrc = process.env.AMOUNT_SRC ?? '10000';

const rates = await user.swap.findRates({
  fromAsset: 'USD/2',
  toAsset: 'USDC/6',
  fromMediums: ['external-us-bank'],
  toMediums: ['base'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No external US bank → Base on-ramp rates available.');
}

console.log('Best rate:', rates.rates[0]);

const result = await user.swap.externalUsBank.create(
  {
    rateSig: rates.rates[0]!.sig,
    amountSrc,
    toMedium: 'base',
    depositInformation: { walletAddress },
    args: { sourceAccountUrn },
  },
  { idempotencyKey: `external-us-bank-onramp-base-${amountSrc}` },
);

console.log('External US bank → Base on-ramp order:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});
