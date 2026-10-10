import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { AccountsClient } from '../src/accounts-client';

const originalFetch = globalThis.fetch;

function authedClient(retry = false): HttpClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: retry
      ? { enabled: true, maxRetries: 1, initialDelay: 0, maxDelay: 0 }
      : { enabled: false },
  });
  http.setAccessToken('test_access_token');
  return http;
}

function okResponse() {
  return new Response(
    JSON.stringify({
      result: { queue_id: 'q_1', status: 'queued', message: 'queued' },
      req_id: 'req_1',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function unavailableResponse() {
  return new Response(
    JSON.stringify({ code: 'E_UNAVAILABLE', message: 'unavailable' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );
}

function mockFetch(responses: Array<() => Response>) {
  const calls: Array<{
    body: { metadata: Record<string, string> };
    headers: Headers;
  }> = [];
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

const params = {
  sourceUrn: 'did:bloque:account:virtual:acc-1',
  destinationUrn: 'did:bloque:account:virtual:acc-2',
  amount: '1000000',
  asset: 'DUSD/6' as const,
};

describe('AccountsClient.transfer reference', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('generates a reference when none is given and reuses it across retries', async () => {
    const calls = mockFetch([unavailableResponse, okResponse]);
    const accounts = new AccountsClient(authedClient(true));

    await accounts.transfer({ ...params, metadata: { note: 'hi' } });

    expect(calls).toHaveLength(2);
    const reference = calls[0].body.metadata.reference;
    expect(typeof reference).toBe('string');
    expect(reference.length).toBeGreaterThan(0);
    expect(calls[0].body.metadata.note).toBe('hi');
    expect(calls[1].body.metadata.reference).toBe(reference);
    expect(calls[0].headers.get('Idempotency-Key')).toBe(reference);
    expect(calls[1].headers.get('Idempotency-Key')).toBe(reference);
  });

  it('generates a different reference per call', async () => {
    const calls = mockFetch([okResponse]);
    const accounts = new AccountsClient(authedClient());

    await accounts.transfer(params);
    await accounts.transfer(params);

    expect(calls[0].body.metadata.reference).not.toBe(
      calls[1].body.metadata.reference,
    );
  });

  it('sends a caller-given metadata.reference as-is', async () => {
    const calls = mockFetch([okResponse]);
    const accounts = new AccountsClient(authedClient());

    await accounts.transfer(
      { ...params, metadata: { reference: 'payment-123' } },
      { idempotencyKey: 'other-key' },
    );

    expect(calls[0].body.metadata.reference).toBe('payment-123');
    expect(calls[0].headers.get('Idempotency-Key')).toBe('other-key');
  });

  it('ignores a blank metadata.reference', async () => {
    const calls = mockFetch([okResponse]);
    const accounts = new AccountsClient(authedClient());

    await accounts.transfer(
      { ...params, metadata: { reference: '   ' } },
      { idempotencyKey: 'payout-inv-2' },
    );
    await accounts.transfer({ ...params, metadata: { reference: '   ' } });

    expect(calls[0].body.metadata.reference).toBe('payout-inv-2');
    expect(calls[1].body.metadata.reference.trim()).not.toBe('');
  });

  it('uses idempotencyKey as the reference when metadata.reference is absent', async () => {
    const calls = mockFetch([okResponse]);
    const accounts = new AccountsClient(authedClient());

    await accounts.transfer(params, { idempotencyKey: 'payout-inv-1' });

    expect(calls[0].body.metadata.reference).toBe('payout-inv-1');
    expect(calls[0].headers.get('Idempotency-Key')).toBe('payout-inv-1');
  });
});
