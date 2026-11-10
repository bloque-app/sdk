import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { AccountsClient } from '../src/accounts-client';
import type { GlobalTransaction, Movement, MovementFee } from '../src/types';

const originalFetch = globalThis.fetch;

function accountsClient(): AccountsClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken('test_access_token');
  return new AccountsClient(http);
}

function mockResponse(body: Record<string, unknown>): void {
  globalThis.fetch = mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  ) as unknown as typeof fetch;
}

const ORDER_SIG = 'order_sig_abc123';

const charged = {
  reference: 'tx_ref_1',
  rail_name: 'substrate_ksmAssetHub',
  direction: 'out',
  type: 'transfer',
  from_account_id: '0xabc',
  to_account_id: '0xdef',
  amount: '100000',
  asset: 'COPM/2',
  details: { order_sig: ORDER_SIG },
  created_at: '2026-11-10T17:47:46Z',
  status: 'settled',
  fee: { amount: '50100', asset: 'COP/2' },
};

const plain = {
  ...charged,
  reference: 'tx_ref_2',
  details: {},
  fee: undefined,
};

describe('movement fee', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('movements() maps fee and orderSig', async () => {
    mockResponse({ data: [charged, plain], page_size: 2, has_more: false });

    const { data } = await accountsClient().movements({
      urn: 'did:bloque:account:virtual:acc-1',
      asset: 'COPM/2',
    });

    expect(data[0].fee).toEqual({ amount: '50100', asset: 'COP/2' });
    expect(data[0].orderSig).toBe(ORDER_SIG);
    expect(data[0].details.order_sig).toBe(ORDER_SIG);
    expect(data[1]).not.toHaveProperty('fee');
    expect(data[1]).not.toHaveProperty('orderSig');
  });

  it('transactions() maps fee and orderSig', async () => {
    mockResponse({ data: [charged, plain], page_size: 2, has_more: false });

    const { data } = await accountsClient().transactions({ asset: 'COPM/2' });

    expect(data[0].fee).toEqual({ amount: '50100', asset: 'COP/2' });
    expect(data[0].orderSig).toBe(ORDER_SIG);
    expect(data[1]).not.toHaveProperty('fee');
    expect(data[1]).not.toHaveProperty('orderSig');
  });

  it('card.movements() passes fee and details.order_sig through', async () => {
    mockResponse({ data: [charged], page_size: 1, has_more: false });

    const { data } = await accountsClient().card.movements({
      urn: 'did:bloque:account:card:usr-1:crd-1',
      asset: 'COPM/2',
    });

    expect(data[0].fee).toEqual({ amount: '50100', asset: 'COP/2' });
    expect(data[0].details.order_sig).toBe(ORDER_SIG);
  });

  it('maps a failed direction, a fee without an order, and drops a non-string order_sig', async () => {
    mockResponse({
      data: [
        { ...charged, direction: 'failed', status: 'cancelled' },
        { ...charged, details: {} },
        { ...charged, details: { order_sig: 42 }, fee: undefined },
      ],
      page_size: 3,
      has_more: false,
    });

    const { data } = await accountsClient().movements({
      urn: 'did:bloque:account:virtual:acc-1',
      asset: 'COPM/2',
      collapsed_view: true,
    });

    const direction: Movement['direction'] = data[0].direction;
    expect(direction).toBe('failed');
    expect(data[1].fee).toEqual({ amount: '50100', asset: 'COP/2' });
    expect(data[1]).not.toHaveProperty('orderSig');
    expect(data[2]).not.toHaveProperty('orderSig');
    expect(data[2]).not.toHaveProperty('fee');
  });

  it('transactions() maps a movement without details', async () => {
    const { details: _omit, ...withoutDetails } = charged;
    mockResponse({ data: [withoutDetails], page_size: 1, has_more: false });

    const { data } = await accountsClient().transactions({ asset: 'COPM/2' });

    expect(data[0].details).toEqual({});
    expect(data[0].fee).toEqual({ amount: '50100', asset: 'COP/2' });
    expect(data[0]).not.toHaveProperty('orderSig');
  });
});

// The fee rule from the accounts guide, kept here so it type-checks.
const NOT_CHARGED = new Set(['cancelled', 'failed', 'ignored']);

function feesByOrder(txs: GlobalTransaction[]): Map<string, MovementFee> {
  const charged = new Map<string, MovementFee>();
  const refunded = new Set<string>();
  for (const tx of txs) {
    if (!tx.orderSig) continue;
    if (!tx.fee) {
      refunded.add(tx.orderSig);
    } else if (tx.direction !== 'failed' && !NOT_CHARGED.has(tx.status)) {
      charged.set(tx.orderSig, tx.fee);
    }
  }
  for (const order of refunded) charged.delete(order);
  return charged;
}

describe('fee rule from the guide', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('counts each order once and skips cancelled and refunded orders', async () => {
    mockResponse({
      data: [
        { ...charged, status: 'pending' },
        charged,
        {
          ...charged,
          details: { order_sig: 'cancelled-order' },
          status: 'cancelled',
        },
        { ...charged, details: { order_sig: 'refunded-order' } },
        {
          ...charged,
          direction: 'in',
          details: { order_sig: 'refunded-order' },
          fee: undefined,
        },
      ],
      page_size: 5,
      has_more: false,
    });

    const { data } = await accountsClient().transactions({ asset: 'COPM/2' });

    expect([...feesByOrder(data).entries()]).toEqual([
      [ORDER_SIG, { amount: '50100', asset: 'COP/2' }],
    ]);
  });
});
