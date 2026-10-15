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

function mockEmptyMovementResponse(): string[] {
  const urls: string[] = [];
  globalThis.fetch = mock((input: string | URL | Request) => {
    urls.push(String(input));
    return Promise.resolve(
      new Response(
        JSON.stringify({ data: [], page_size: 0, has_more: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }) as unknown as typeof fetch;
  return urls;
}

describe('LATAM account assets', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it.each(['MXNB/2', 'BRLB/2'] as const)(
    'queries account movements using %s',
    async (asset) => {
      const urls = mockEmptyMovementResponse();

      await accountsClient().movements({
        urn: 'did:bloque:account:virtual:acc-1',
        asset,
      });

      expect(urls[0]).toContain(`asset=${encodeURIComponent(asset)}`);
    },
  );

  it.each(['MXNB/2', 'BRLB/2'] as const)(
    'queries global transactions using %s',
    async (asset) => {
      const urls = mockEmptyMovementResponse();

      await accountsClient().transactions({ asset });

      expect(urls[0]).toContain(`asset=${encodeURIComponent(asset)}`);
    },
  );

  it.each(['MXNB/2', 'BRLB/2'] as const)(
    'queries card movements using %s',
    async (asset) => {
      const urls = mockEmptyMovementResponse();

      await accountsClient().card.movements({
        urn: 'did:bloque:account:card:acc-1',
        asset,
      });

      expect(urls[0]).toContain(`asset=${encodeURIComponent(asset)}`);
    },
  );

  it.each(['MXNB/2', 'BRLB/2'])(
    'rejects %s as a card settlement asset when creating a card',
    async (asset) => {
      await expect(
        accountsClient().card.create({ defaultAsset: asset as never }),
      ).rejects.toThrow(
        `Invalid card settlement asset "${asset}". Supported card assets: DUSD/6, COPB/6, COPM/2, KSM/12`,
      );
    },
  );

  it.each(['MXNB/2', 'BRLB/2'])(
    'rejects %s as a card settlement asset when updating metadata',
    async (asset) => {
      await expect(
        accountsClient().card.updateMetadata({
          urn: 'did:bloque:account:card:acc-1',
          defaultAsset: asset as never,
        }),
      ).rejects.toThrow(
        `Invalid card settlement asset "${asset}". Supported card assets: DUSD/6, COPB/6, COPM/2, KSM/12`,
      );
    },
  );
});
