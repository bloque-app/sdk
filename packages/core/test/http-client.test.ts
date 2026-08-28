import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { BloqueAuthenticationError } from '../src/errors';
import { HttpClient } from '../src/http-client';
import { SDK_NAME, SDK_VERSION } from '../src/version';

const SK_KEY = 'sk_test_abc123';

function createApiKeyClient(): HttpClient {
  return new HttpClient({
    auth: { type: 'apiKey', apiKey: SK_KEY },
    mode: 'sandbox',
  });
}

describe('HttpClient.ensureExchanged()', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('happy path: exchanges sk_ key and uses Bearer token', async () => {
    const exchangeResponse = {
      access_token: 'jwt_token_123',
      expires_in: 900,
      token_type: 'Bearer',
    };

    let callCount = 0;
    globalThis.fetch = mock(
      (_url: string | URL | Request, init?: RequestInit) => {
        callCount++;
        if (callCount === 1) {
          const body = JSON.parse(init?.body as string);
          expect(body.key).toBe(SK_KEY);
          return Promise.resolve(
            new Response(JSON.stringify(exchangeResponse), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      },
    ) as typeof fetch;

    const client = createApiKeyClient();
    await client.ensureExchanged();

    expect(client.accessToken).toBe('jwt_token_123');
  });

  it('JWT still valid: does not call exchange again', async () => {
    const exchangeResponse = {
      access_token: 'jwt_valid',
      expires_in: 900,
      token_type: 'Bearer',
    };

    let fetchCallCount = 0;
    globalThis.fetch = mock(() => {
      fetchCallCount++;
      return Promise.resolve(
        new Response(JSON.stringify(exchangeResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }) as typeof fetch;

    const client = createApiKeyClient();

    await client.ensureExchanged();
    expect(fetchCallCount).toBe(1);

    await client.ensureExchanged();
    expect(fetchCallCount).toBe(1);
  });

  it('promise coalescing: 3 concurrent calls produce only 1 fetch', async () => {
    let fetchCallCount = 0;
    globalThis.fetch = mock(() => {
      fetchCallCount++;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'jwt_coalesced',
            expires_in: 900,
            token_type: 'Bearer',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }) as typeof fetch;

    const client = createApiKeyClient();

    await Promise.all([
      client.ensureExchanged(),
      client.ensureExchanged(),
      client.ensureExchanged(),
    ]);

    expect(fetchCallCount).toBe(1);
    expect(client.accessToken).toBe('jwt_coalesced');
  });

  it('exchange 401: throws BloqueAuthenticationError', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ message: 'Invalid API key', code: 'UNAUTHORIZED' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ) as typeof fetch;

    const client = createApiKeyClient();

    await expect(client.ensureExchanged()).rejects.toThrow(
      BloqueAuthenticationError,
    );
  });

  it('exchange 429 then success: retries and stores token', async () => {
    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: 'Rate limited' }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '0',
            },
          }),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'jwt_after_retry',
            expires_in: 900,
            token_type: 'Bearer',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }) as typeof fetch;

    const client = createApiKeyClient();
    await client.ensureExchanged();

    expect(callCount).toBe(2);
    expect(client.accessToken).toBe('jwt_after_retry');
  });
});

describe('HttpClient — X-Bloque-SDK header', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends the SDK name/version on every request', async () => {
    let capturedHeaders: Record<string, string> | undefined;

    globalThis.fetch = mock(
      (_url: string | URL | Request, init?: RequestInit) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      },
    ) as typeof fetch;

    const client = new HttpClient({
      origin: 'test-origin',
      auth: { type: 'originKey', originKey: 'sk_dev_origin' },
      mode: 'sandbox',
      retry: { enabled: false },
    });

    await client.request({ method: 'GET', path: '/api/aliases' });

    expect(capturedHeaders?.['X-Bloque-SDK']).toBe(
      `${SDK_NAME}@${SDK_VERSION}`,
    );
  });

  it('is not overridden by a caller-supplied headers object', async () => {
    let capturedHeaders: Record<string, string> | undefined;

    globalThis.fetch = mock(
      (_url: string | URL | Request, init?: RequestInit) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      },
    ) as typeof fetch;

    const client = new HttpClient({
      origin: 'test-origin',
      auth: { type: 'originKey', originKey: 'sk_dev_origin' },
      mode: 'sandbox',
      retry: { enabled: false },
    });

    await client.request({
      method: 'GET',
      path: '/api/aliases',
      headers: { 'X-Custom-Header': 'value' },
    });

    expect(capturedHeaders?.['X-Bloque-SDK']).toBe(
      `${SDK_NAME}@${SDK_VERSION}`,
    );
    expect(capturedHeaders?.['X-Custom-Header']).toBe('value');
  });
});
