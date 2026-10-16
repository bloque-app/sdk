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

describe('BRE-B key resolution', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('preserves a null customerId returned by the API', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        Response.json({
          req_id: 'req-1',
          result: {
            id: 'resolution-1',
            resolutionId: 'resolution-1',
            customerId: null,
            key: { keyType: 'ALPHA', keyValue: '@recipient' },
            owner: null,
            participant: null,
            account: null,
            receptorNode: null,
            resolvedAt: null,
            expiresAt: null,
            raw: {},
          },
        }),
      ),
    ) as unknown as typeof fetch;

    const { data, error } = await accountsClient().breb.resolveKey({
      keyType: 'ALPHA',
      key: '@recipient',
    });

    expect(error).toBeNull();
    expect(data?.customerId).toBeNull();
  });
});
