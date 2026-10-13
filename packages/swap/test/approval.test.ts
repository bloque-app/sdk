import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  BloqueApprovalArgsRequiredError,
  HttpClient,
  OPERATION_APPROVAL_HEADER,
} from '@bloque/sdk-core';
import { BrebClient } from '../src/breb/breb-client';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function authedClient(): HttpClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken('test_access_token');
  http.setUrn('did:bloque:test:taker');
  return http;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Call = { body: Record<string, unknown>; headers: Headers };

function mockFetch(responses: Array<() => Response>) {
  const calls: Call[] = [];
  globalThis.fetch = mock(
    (_url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        body: JSON.parse(String(init?.body)),
        headers: new Headers(init?.headers),
      });
      const next = responses[Math.min(calls.length - 1, responses.length - 1)];
      return Promise.resolve(next());
    },
  ) as unknown as typeof fetch;
  return calls;
}

const orderOk = () =>
  json(200, {
    result: {
      order: {
        id: '1',
        order_sig: 'order-sig',
        rate_sig: 'rate-sig',
        swap_sig: 's',
        taker: 't',
        maker: 'm',
        from_asset: 'a',
        to_asset: 'b',
        from_medium: 'kusama',
        to_medium: 'breb',
        from_amount: '1',
        to_amount: '1',
        at: 'now',
        graph_id: 'g',
        status: 'pending',
      },
    },
    req_id: 'r',
  });

const params = {
  rateSig: 'rate-sig',
  amountSrc: '1000',
  depositInformation: {
    resolutionId: 'res-1',
    destinationKey: { keyValue: '3001234567', keyType: 'PHONE' as const },
  },
  args: { sourceAccountUrn: 'did:bloque:account:virtual:acc-1' },
};

describe('swap order approval', () => {
  it('repeats the take with the same rate_sig and args plus the approval header', async () => {
    const calls = mockFetch([orderOk]);
    const breb = new BrebClient(authedClient());

    await breb.create(params, { idempotencyKey: 'take-1' });
    await breb.create(params, {
      idempotencyKey: 'take-2',
      approval: 'signed-approval',
    });

    expect(calls[1].body).toEqual(calls[0].body);
    expect(calls[1].body.rate_sig).toBe('rate-sig');
    expect(calls[0].headers.has(OPERATION_APPROVAL_HEADER)).toBe(false);
    expect(calls[1].headers.get(OPERATION_APPROVAL_HEADER)).toBe(
      'signed-approval',
    );
    expect(calls[1].headers.get('Idempotency-Key')).toBe('take-2');
  });

  it('throws BloqueApprovalArgsRequiredError naming the missing args', async () => {
    mockFetch([
      () =>
        json(422, {
          error: true,
          code: 'E_APPROVAL_ARGS_REQUIRED',
          message: 'E_APPROVAL_ARGS_REQUIRED',
          extra_details: {
            reason: 'first_node_args_required',
            args: ['account_urn'],
          },
        }),
    ]);
    const breb = new BrebClient(authedClient());

    const error = await breb.create(params).catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalArgsRequiredError);
    expect(error.args).toEqual(['account_urn']);
  });
});
