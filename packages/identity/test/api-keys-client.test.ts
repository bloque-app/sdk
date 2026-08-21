import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { ApiKeysClient } from '../src/api-keys/api-keys-client';

const SK_KEY = 'sk_test_boundkey12abcdefghijklmnopqrstuvwxyz';
const OPERATOR_JWT = 'origin_operator_jwt';
const IDENTITY_URN = 'did:bloque:colocapay:alice';

function authorization(init?: RequestInit): string | undefined {
  const headers = init?.headers;
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return undefined;
  }
  return (headers as Record<string, string>).Authorization;
}

function captureFetch() {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const path = String(url);
    if (path.endsWith('/api/api-keys') && init?.method === 'POST') {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            key_id: 'sk_test_abc123def456',
            secret_key: SK_KEY,
            publishable_key: 'pk_test_pub',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }
    return Promise.resolve(
      new Response(
        JSON.stringify({
          access_token: 'exchanged_jwt',
          expires_in: 900,
          token_type: 'Bearer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }) as typeof fetch;
  return calls;
}

function originKeyClient(accessToken?: string): HttpClient {
  const http = new HttpClient({
    origin: 'colocapay',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  if (accessToken) {
    http.setAccessToken(accessToken);
  }
  return http;
}

describe('ApiKeysClient origin-operator', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('create sends the origin-operator Bearer and mints a key', async () => {
    const calls = captureFetch();
    const http = originKeyClient(OPERATOR_JWT);
    const result = await new ApiKeysClient(http).create({
      name: 'cs-readonly',
      scopes: ['identity.read.origin', 'alias.find.origin'],
      domains: [],
      expiration: 'never',
    });

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call).toBeDefined();
    expect(call.url).toBe('https://api.dev-bloque.app/api/api-keys');
    expect(call.init?.method).toBe('POST');
    expect(authorization(call.init)).toBe(`Bearer ${OPERATOR_JWT}`);
    expect(JSON.parse(call.init?.body as string)).toEqual({
      name: 'cs-readonly',
      scopes: ['identity.read.origin', 'alias.find.origin'],
      domains: [],
      expiration: 'never',
    });
    expect(result.secretKey).toBe(SK_KEY);
  });

  it('exchange({ key }) stays unauthenticated (discovery)', async () => {
    const calls = captureFetch();
    const http = originKeyClient(OPERATOR_JWT);
    const result = await new ApiKeysClient(http).exchange({ key: SK_KEY });

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call).toBeDefined();
    expect(call.url).toBe('https://api.dev-bloque.app/api/api-keys/exchange');
    expect(authorization(call.init)).toBeUndefined();
    expect(JSON.parse(call.init?.body as string)).toEqual({ key: SK_KEY });
    expect(result.accessToken).toBe('exchanged_jwt');
    expect(result.expiresIn).toBe(900);
    expect(result.tokenType).toBe('Bearer');
  });

  it('exchange({ key, asIdentity }) sends as_identity and the operator Bearer', async () => {
    const calls = captureFetch();
    const http = originKeyClient(OPERATOR_JWT);
    await new ApiKeysClient(http).exchange({
      key: SK_KEY,
      scopes: ['payments.read'],
      asIdentity: IDENTITY_URN,
    });

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call).toBeDefined();
    expect(authorization(call.init)).toBe(`Bearer ${OPERATOR_JWT}`);
    expect(JSON.parse(call.init?.body as string)).toEqual({
      key: SK_KEY,
      scopes: ['payments.read'],
      as_identity: IDENTITY_URN,
    });
  });

  it('exchange({ asIdentity }) without a session token does not invent a Bearer', async () => {
    const calls = captureFetch();
    const http = originKeyClient();
    await new ApiKeysClient(http).exchange({
      key: SK_KEY,
      asIdentity: IDENTITY_URN,
    });

    const call = calls[0];
    expect(call).toBeDefined();
    expect(authorization(call.init)).toBeUndefined();
    expect(JSON.parse(call.init?.body as string)).toEqual({
      key: SK_KEY,
      as_identity: IDENTITY_URN,
    });
  });

  it('exchange with jwt tokenStorage forwards the stored operator Bearer', async () => {
    const store: { token: string | null } = { token: OPERATOR_JWT };
    const http = new HttpClient({
      origin: 'colocapay',
      auth: { type: 'jwt' },
      platform: 'node',
      mode: 'sandbox',
      retry: { enabled: false },
      tokenStorage: {
        get: () => store.token,
        set: (token) => {
          store.token = token;
        },
        clear: () => {
          store.token = null;
        },
      },
    });

    const calls = captureFetch();
    await new ApiKeysClient(http).exchange({
      key: SK_KEY,
      asIdentity: IDENTITY_URN,
    });

    const call = calls[0];
    expect(call).toBeDefined();
    expect(authorization(call.init)).toBe(`Bearer ${OPERATOR_JWT}`);
  });
});
