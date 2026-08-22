import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { OrgsClient } from '../src/orgs-client';

const USER_JWT = 'user_jwt_token';
const ORG_URN = 'did:bloque:orgs:acme';

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

describe('OrgsClient.createOrigin()', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('POSTs /api/orgs/:orgUrn/origins with namespace and maps the key', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    globalThis.fetch = mock(
      (url: string | URL | Request, init?: RequestInit) => {
        capturedUrl = String(url);
        capturedInit = init;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              origin: 'acme-pay',
              org_urn: ORG_URN,
              origin_api_key: 'sk_test_origin',
              roles: ['origin-cs:acme-pay'],
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      },
    ) as typeof fetch;

    const result = await new OrgsClient(createConnectedClient()).createOrigin(
      ORG_URN,
      { namespace: 'acme-pay' },
    );

    expect(capturedUrl).toBe(
      `https://api.dev-bloque.app/api/orgs/${encodeURIComponent(ORG_URN)}/origins`,
    );
    expect(capturedInit?.method).toBe('POST');
    expect(
      capturedInit &&
        (capturedInit.headers as Record<string, string>).Authorization,
    ).toBe(`Bearer ${USER_JWT}`);
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      namespace: 'acme-pay',
    });
    expect(result).toEqual({
      origin: 'acme-pay',
      orgUrn: ORG_URN,
      originApiKey: 'sk_test_origin',
      roles: ['origin-cs:acme-pay'],
    });
  });
});
