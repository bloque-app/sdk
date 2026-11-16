import { SDK, withApproval } from '../../../packages/sdk/src/index';

/**
 * Withdraw a USDC balance to a Polygon address, approved once with your
 * passkey.
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
 * Steps:
 * 1. Find the rate.
 * 2. Withdraw the amount to the operator account. The approval link is
 *    printed; approve it with your passkey. It covers the account, the amount
 *    and the Polygon address.
 * 3. Create the order with the withdrawal's reference. It matches what you
 *    approved, so it needs no second approval.
 * 4. Poll the order until it is completed or failed.
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

if (!/^[1-9][0-9]*$/.test(amountSrc)) {
  throw new Error(
    `Amount must be a positive integer in 6-decimal units, got "${amountSrc}".`,
  );
}

// 1. Rate
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

// 2. Withdraw to the operator account. The first call needs your passkey
// approval: the link is printed, and withApproval waits for it and repeats
// the call once.
const withdrawal = await withApproval(
  (approval) =>
    user.swap.polygon.withdraw(
      { sourceAccountUrn, amount: amountSrc, walletAddress },
      { approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);
console.log('Withdrawal:', withdrawal);

// 3. Create the order with the withdrawal's reference. It matches the
// withdrawal, so no second approval is asked; withApproval only covers the
// case where it would be.
const result = await withApproval(
  (approval) =>
    user.swap.polygon.create(
      {
        rateSig: rate.sig,
        amountSrc,
        depositInformation: { walletAddress },
        args: { sourceAccountUrn, withdrawalOp: withdrawal.withdrawalOp },
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
