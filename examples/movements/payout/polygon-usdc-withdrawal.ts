import { SDK, withApproval } from '../../../packages/sdk/src/index';

/**
 * Withdraw a USDC balance to a Polygon address, approved with your passkey.
 *
 * Edge: kusama -> polygon, BUSDC/6 -> USDC/6
 *
 * Inputs (arguments or environment):
 *   bun examples/movements/payout/polygon-usdc-withdrawal.ts \
 *     <sourceAccountUrn> <walletAddress> <amount>
 *   or SOURCE_ACCOUNT_URN, WALLET_ADDRESS, AMOUNT_SRC.
 *
 * `amount` is in the asset's smallest unit (6 decimals): 1000000 = 1 USDC.
 * Auth: ORIGIN, ORIGIN_KEY, USER_HANDLE (default '@nestor'), MODE
 * ('sandbox' by default).
 *
 * Steps: read the balance, find the rate, create the order (the approval
 * link is printed; approve it with your passkey), then poll the order until
 * it is completed or failed.
 */

const [argUrn, argWallet, argAmount] = process.argv.slice(2);
const sourceAccountUrn = argUrn ?? process.env.SOURCE_ACCOUNT_URN;
const walletAddress = argWallet ?? process.env.WALLET_ADDRESS;
const amountSrc = argAmount ?? process.env.AMOUNT_SRC;

if (!sourceAccountUrn || !walletAddress || !amountSrc) {
  console.error(
    'Usage: polygon-usdc-withdrawal.ts <sourceAccountUrn> <walletAddress> <amount>\n' +
      '(or SOURCE_ACCOUNT_URN, WALLET_ADDRESS, AMOUNT_SRC)',
  );
  process.exit(1);
}

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: (process.env.MODE as 'production' | 'sandbox') ?? 'sandbox',
  platform: 'node',
});

const user = await bloque.connect(process.env.USER_HANDLE ?? '@nestor');

// 1. Balance of the source account
const balance = await user.accounts.balance(sourceAccountUrn);
const usdc = balance['BUSDC/6'];
console.log('USDC balance (BUSDC/6):', usdc?.current ?? '0');

if (!usdc || BigInt(usdc.current) < BigInt(amountSrc)) {
  throw new Error(
    `Balance ${usdc?.current ?? '0'} is below the amount ${amountSrc}.`,
  );
}

// 2. Rate
const rates = await user.swap.findRates({
  fromAsset: 'BUSDC/6',
  toAsset: 'USDC/6',
  fromMediums: ['kusama'],
  toMediums: ['polygon'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No Polygon USDC withdrawal rates available.');
}

const rate = rates.rates[0]!;
console.log('Rate:', { sig: rate.sig, ratio: rate.ratio, fee: rate.fee.value });

// 3. Create the order. The first call needs your passkey approval: the link is
// printed, and withApproval waits for it and repeats the call once.
const result = await withApproval(
  (approval) =>
    user.swap.polygon.create(
      {
        rateSig: rate.sig,
        amountSrc,
        depositInformation: { walletAddress },
        args: { sourceAccountUrn },
      },
      { approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);

console.log('Order created:', {
  requestId: result.requestId,
  orderSig: result.order.orderSig,
  status: result.order.status,
  fromAmount: result.order.fromAmount,
  toAmount: result.order.toAmount,
});

// 4. Poll until completed or failed
const intervalMs = Number(process.env.POLL_INTERVAL_MS ?? 5000);
const deadline = Date.now() + Number(process.env.POLL_TIMEOUT_MS ?? 600000);

while (Date.now() < deadline) {
  const { orders } = await user.swap.listOrders({
    orderSig: result.order.orderSig,
  });
  const order = orders[0];
  console.log('Order status:', order?.status ?? 'not found');

  if (order?.status === 'completed') {
    console.log('Done: Polygon USDC sent to', walletAddress);
    process.exit(0);
  }
  if (order?.status === 'failed') {
    console.error('Order failed:', order.failureReason, order.failureDetails);
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(
  'Timed out waiting for the order. Check it again with listOrders.',
);
process.exit(1);
