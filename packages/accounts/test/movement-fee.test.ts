import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { AccountsClient } from '../src/accounts-client';

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
});
