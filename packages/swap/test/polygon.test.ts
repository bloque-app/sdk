import { afterEach, describe, expect, it, mock } from 'bun:test';
import { BloqueConfigError, HttpClient } from '@bloque/sdk-core';
import { PolygonClient } from '../src/polygon/polygon-client';
import type { CreatePolygonOrderParams } from '../src/polygon/types';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const WALLET = '0xAbCdEf0123456789aBcDeF0123456789abcdef01';
const SOURCE = 'did:bloque:account:virtual:acc-1';

function authedClient(urn: string | undefined = 'did:bloque:test:taker') {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken('test_access_token');
  if (urn) http.setUrn(urn);
  return http;
}

type Call = {
  url: string;
  method?: string;
  body: Record<string, unknown>;
  headers: Headers;
};

function mockFetch() {
  const calls: Call[] = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method,
      body: JSON.parse(String(init?.body)),
      headers: new Headers(init?.headers),
    });
    return Promise.resolve(
      new Response(
        JSON.stringify({
          result: {
            order: {
              id: '1',
              order_sig: 'order-sig',
              rate_sig: 'rate-sig',
              swap_sig: 's',
              taker: 't',
              maker: 'm',
              from_asset: 'BUSDC/6',
              to_asset: 'USDC/6',
              from_medium: 'kusama',
              to_medium: 'polygon',
              from_amount: '1000000',
              to_amount: '990000',
              at: 'now',
              graph_id: 'g',
              status: 'in_progress',
            },
          },
          req_id: 'r',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }) as unknown as typeof fetch;
  return calls;
}

const params: CreatePolygonOrderParams = {
  rateSig: 'rate-sig',
  amountSrc: '1000000',
  depositInformation: { walletAddress: WALLET },
  args: { sourceAccountUrn: SOURCE },
};

describe('PolygonClient.create', () => {
  it('maps the params to the wire order', async () => {
    const calls = mockFetch();

    const result = await new PolygonClient(authedClient()).create(params, {
      idempotencyKey: 'k',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('PUT');
    expect(calls[0].url).toEndWith('/api/order');
    expect(calls[0].body).toEqual({
      taker_urn: 'did:bloque:test:taker',
      type: 'src',
      rate_sig: 'rate-sig',
      from_medium: 'kusama',
      to_medium: 'polygon',
      amount_src: '1000000',
      deposit_information: { wallet_address: WALLET },
      args: { account_urn: SOURCE },
    });
    expect(calls[0].headers.get('Idempotency-Key')).toBe('k');
    expect(result.requestId).toBe('r');
    expect(result.execution).toBeUndefined();
    expect(result.order).toMatchObject({
      orderSig: 'order-sig',
      fromMedium: 'kusama',
      toMedium: 'polygon',
      status: 'in_progress',
    });
  });

  it('sends amount_dst for dst orders, and the optional fields', async () => {
    const calls = mockFetch();

    await new PolygonClient(authedClient()).create({
      rateSig: 'rate-sig',
      type: 'dst',
      amountDst: '990000',
      depositInformation: { walletAddress: WALLET },
      args: { sourceAccountUrn: SOURCE },
      webhookUrl: 'https://example.com/hook',
      metadata: { ref: 'x' },
      nodeId: 'n1',
    });

    expect(calls[0].body).toMatchObject({
      type: 'dst',
      amount_dst: '990000',
      webhook_url: 'https://example.com/hook',
      metadata: { ref: 'x' },
      node_id: 'n1',
    });
    expect(calls[0].body.amount_src).toBeUndefined();
  });

  it.each([
    ['empty', ''],
    ['missing 0x', 'Ab'.repeat(20)],
    ['too short', '0x1234'],
    ['too long', `0x${'1'.repeat(41)}`],
    ['non-hex', `0x${'g'.repeat(40)}`],
    ['zero address', `0x${'0'.repeat(40)}`],
  ])(
    'rejects a wallet address that is %s before any request',
    async (_n, walletAddress) => {
      const calls = mockFetch();

      const error = await new PolygonClient(authedClient())
        .create({ ...params, depositInformation: { walletAddress } })
        .catch((e) => e);

      expect(error).toBeInstanceOf(BloqueConfigError);
      expect(calls).toHaveLength(0);
    },
  );

  it('rejects a missing source account', async () => {
    const calls = mockFetch();

    const error = await new PolygonClient(authedClient())
      .create({ ...params, args: { sourceAccountUrn: '' } })
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueConfigError);
    expect(calls).toHaveLength(0);
  });

  it('rejects when there is no session URN', async () => {
    const calls = mockFetch();

    const error = await new PolygonClient(authedClient(''))
      .create(params)
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueConfigError);
    expect(calls).toHaveLength(0);
  });
});
