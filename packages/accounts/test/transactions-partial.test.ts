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

describe('global transactions partial result', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps partial and partial_accounts', async () => {
    mockResponse({
      data: [],
      page_size: 0,
      has_more: false,
      partial: true,
      partial_accounts: ['did:bloque:account:virtual:acc-1'],
    });

    const result = await accountsClient().transactions({ asset: 'DUSD/6' });

    expect(result.partial).toBe(true);
    expect(result.partialAccounts).toEqual([
      'did:bloque:account:virtual:acc-1',
    ]);
  });

  it('is not partial when the API omits the fields', async () => {
    mockResponse({ data: [], page_size: 0, has_more: false });

    const result = await accountsClient().transactions({ asset: 'DUSD/6' });

    expect(result.partial).toBe(false);
    expect(result).not.toHaveProperty('partialAccounts');
  });
});
