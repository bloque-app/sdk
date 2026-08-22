import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { OrgsClient } from '../src/orgs-client';

const ORIGIN_KEY = 'sk_dev_test_origin_key';
const USER_JWT = 'user_jwt_token';
const OPERATOR_JWT = 'origin_operator_jwt';

function createConnectedClient(): HttpClient {
  const http = new HttpClient({
    origin: 'colocapay',
    auth: { type: 'originKey', originKey: ORIGIN_KEY },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken(USER_JWT);
  return http;
}

describe('OrgsClient.assumeOrigin()', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('POSTs /api/origins/:namespace/as with the current user Bearer', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    globalThis.fetch = mock(
      (url: string | URL | Request, init?: RequestInit) => {
        capturedUrl = String(url);
        capturedInit = init;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: OPERATOR_JWT,
              expires_in: 900,
              token_type: 'Bearer',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      },
    ) as typeof fetch;

    const http = createConnectedClient();
    const orgs = new OrgsClient(http);
    const result = await orgs.assumeOrigin('colocapay');

    expect(capturedUrl).toBe(
      'https://api.dev-bloque.app/api/origins/colocapay/as',
    );
    expect(capturedInit?.method).toBe('POST');
    expect(
      capturedInit &&
        (capturedInit.headers as Record<string, string>).Authorization,
    ).toBe(`Bearer ${USER_JWT}`);
    expect(result).toEqual({
      accessToken: OPERATOR_JWT,
      expiresIn: 900,
      tokenType: 'Bearer',
    });
  });

  it('switches the session to the origin-operator JWT', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: OPERATOR_JWT,
            expires_in: 900,
            token_type: 'Bearer',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ) as typeof fetch;

    const http = createConnectedClient();
    const orgs = new OrgsClient(http);
    await orgs.assumeOrigin('colocapay');

    expect(http.accessToken).toBe(OPERATOR_JWT);
    expect(http.origin).toBe('colocapay');
  });

  it('encodes the namespace in the path', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock((url: string | URL | Request) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: OPERATOR_JWT,
            expires_in: 900,
            token_type: 'Bearer',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }) as typeof fetch;

    const http = createConnectedClient();
    await new OrgsClient(http).assumeOrigin('bloque-whatsapp');

    expect(capturedUrl).toBe(
      'https://api.dev-bloque.app/api/origins/bloque-whatsapp/as',
    );
  });

  it('persists the operator JWT for jwt auth tokenStorage', async () => {
    const store: { token: string | null } = { token: USER_JWT };
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

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: OPERATOR_JWT,
            expires_in: 900,
            token_type: 'Bearer',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ) as typeof fetch;

    await new OrgsClient(http).assumeOrigin('colocapay');

    expect(http.accessToken).toBe(OPERATOR_JWT);
    expect(store.token).toBe(OPERATOR_JWT);
  });
});
