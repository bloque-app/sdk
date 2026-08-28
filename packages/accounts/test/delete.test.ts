import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { CardClient } from '../src/card/card-client';
import { PolygonClient } from '../src/polygon/polygon-client';
import { VirtualClient } from '../src/virtual/virtual-client';

const ACCESS_TOKEN = 'test_access_token';

function authedClient(): HttpClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken(ACCESS_TOKEN);
  return http;
}

function fakeAccount(medium: string, urn: string, status = 'deleted') {
  return {
    id: 'abc123',
    urn,
    medium,
    details: {},
    status,
    owner_urn: 'did:bloque:test-origin:user-123',
    ledger_account_id: '0xledger',
    webhook_url: null,
    metadata: {},
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

function mockDeleteSuccess(account: ReturnType<typeof fakeAccount>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return Promise.resolve(
      new Response(JSON.stringify({ result: { account }, req_id: 'req_1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }) as typeof fetch;
  return calls;
}

function mockDeleteBalanceError() {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return Promise.resolve(
      new Response(
        JSON.stringify({
          error: true,
          code: 'E_ACCOUNT_HAS_BALANCE',
          message: 'E_ACCOUNT_HAS_BALANCE',
          path: '/api/accounts/test',
          extra_details: {
            message:
              'This account still holds a balance. Withdraw all funds before deleting it.',
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }) as typeof fetch;
  return calls;
}

describe('CardClient.delete / VirtualClient.delete / PolygonClient.delete', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('CardClient.delete sends DELETE to /api/accounts/:urn and maps the deleted account', async () => {
    const urn = 'did:bloque:account:card:abc123';
    const calls = mockDeleteSuccess(fakeAccount('card', urn));

    const result = await new CardClient(authedClient()).delete(urn);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      `https://api.dev-bloque.app/api/accounts/${urn}`,
    );
    expect(calls[0]?.init?.method).toBe('DELETE');
    expect(result.status).toBe('deleted');
    expect(result.urn).toBe(urn);
  });

  it('VirtualClient.delete sends DELETE to /api/accounts/:urn and maps the deleted account', async () => {
    const urn = 'did:bloque:account:virtual:abc123';
    const calls = mockDeleteSuccess(fakeAccount('virtual', urn));

    const result = await new VirtualClient(authedClient()).delete(urn);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      `https://api.dev-bloque.app/api/accounts/${urn}`,
    );
    expect(calls[0]?.init?.method).toBe('DELETE');
    expect(result.status).toBe('deleted');
    expect(result.urn).toBe(urn);
  });

  it('PolygonClient.delete sends DELETE to /api/accounts/:urn and maps the deleted account', async () => {
    const urn = 'did:bloque:account:polygon:0xabc123';
    const calls = mockDeleteSuccess(fakeAccount('polygon', urn));

    const result = await new PolygonClient(authedClient()).delete(urn);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      `https://api.dev-bloque.app/api/accounts/${urn}`,
    );
    expect(calls[0]?.init?.method).toBe('DELETE');
    expect(result.status).toBe('deleted');
    expect(result.urn).toBe(urn);
  });

  it('surfaces E_ACCOUNT_HAS_BALANCE (409) as a catchable error with the real code', async () => {
    mockDeleteBalanceError();
    const urn = 'did:bloque:account:card:abc123';

    let error: unknown;
    try {
      await new CardClient(authedClient()).delete(urn);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect((error as { status?: number }).status).toBe(409);
    expect((error as { code?: string }).code).toBe('E_ACCOUNT_HAS_BALANCE');
  });
});
