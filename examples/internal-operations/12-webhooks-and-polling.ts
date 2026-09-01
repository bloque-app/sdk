import { SDK } from '../../packages/sdk/src/index';

/**
 * Confirming operation results: webhooks + polling.
 *
 * Any operation that takes a `webhookUrl` (account creation, `swap.*.create`,
 * `accounts.batchTransfer`) POSTs a status update to it as the underlying
 * graph/order progresses — point it at your own endpoint and update your
 * side when it fires. There is no SDK-side signature-verification helper;
 * validate the payload however your `webhookUrl` endpoint is set up to.
 *
 * If you'd rather not run a public endpoint (local dev, batch jobs), poll
 * instead:
 * - `swap.listOrders({ graphId })` for swap/payout order status.
 * - `accounts.movements(...)` / `accounts.transactions(...)` for ledger-level
 *   confirmation once funds actually land.
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
const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:kusama-user-001';

const rates = await user.swap.findRates({
  fromAsset: 'DUSD/6',
  toAsset: 'USD/2',
  fromMediums: ['kusama'],
  toMediums: ['rtp'],
  amountSrc,
});

if (rates.rates.length === 0) {
  throw new Error('No RTP payout rates available.');
}

// Option A: webhook-driven — pass webhookUrl, your endpoint gets notified.
const order = await user.swap.rtp.create(
  {
    rateSig: rates.rates[0]!.sig,
    amountSrc,
    webhookUrl: 'https://your-app.com/webhooks/bloque',
    depositInformation: {
      owner: 'Jane Doe',
      accountNumber: '1234567890',
      routingNumber: '063108680',
      accountType: 'checking',
    },
    args: { sourceAccountUrn },
  },
  { idempotencyKey: `webhook-demo-${amountSrc}` },
);

console.log(
  'Order created, will notify webhookUrl on updates:',
  order.order.id,
);

// Option B: polling — no public endpoint needed.
async function pollUntilSettled(graphId: string, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { orders } = await user.swap.listOrders({ graphId });
    const current = orders[0];
    if (current && ['completed', 'failed'].includes(current.status)) {
      return current;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`Timed out waiting for graph ${graphId} to settle.`);
}

const finalOrder = await pollUntilSettled(order.order.graphId);
console.log('Final status:', finalOrder.status);

// Once settled, confirm funds actually moved at the ledger level.
const movements = await user.accounts.movements({
  urn: sourceAccountUrn,
  asset: 'DUSD/6',
  reference: order.order.id,
});
console.log('Matching ledger movements:', movements.data);
