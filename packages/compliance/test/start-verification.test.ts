import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { KycClient } from '../src/kyc/kyc-client';

const USER_JWT = 'user_jwt_token';

function createConnectedClient(): HttpClient {
  const http = new HttpClient({
    origin: 'colocapay',
    auth: { type: 'originKey', originKey: 'sk_dev_test_origin_key' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken(USER_JWT);
  return http;
}

describe('KycClient.startVerification()', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockStart(status = 201) {
    let capturedBody: unknown;
    globalThis.fetch = mock(
      (_url: string | URL | Request, init?: RequestInit) => {
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              url: 'https://kyc.example/form',
              type: 'kyc',
              level: 'basic',
              provider: 'AMLBOT',
              status: 'approved',
            }),
            { status, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      },
    ) as typeof fetch;
    return () => capturedBody;
  }

  it('defaults to kyc / person', async () => {
    const body = mockStart();
    await new KycClient(createConnectedClient()).startVerification({
      urn: 'did:bloque:bloque-id:alice',
    });
    expect(body()).toEqual({
      urn: 'did:bloque:bloque-id:alice',
      type: 'kyc',
      accompliceType: 'person',
    });
  });

  it('sends kyb / company for an org URN', async () => {
    const body = mockStart();
    await new KycClient(createConnectedClient()).startVerification({
      urn: 'did:bloque:orgs:acme',
      type: 'kyb',
    });
    expect(body()).toEqual({
      urn: 'did:bloque:orgs:acme',
      type: 'kyb',
      accompliceType: 'company',
    });
  });
});
