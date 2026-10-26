import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  BloquePasskeyRegistrationUnavailableError,
  BloqueReturnUrlNotAllowedError,
  HttpClient,
} from '@bloque/sdk-core';
import { PasskeysClient } from '../src/passkeys/passkeys-client';

const SESSION_JWT = 'user_session_jwt';
const RETURN_URL = 'https://wallet.example.com/settings/security';
const LINK_URL = 'https://id.bloque.sh/passkey#token=link_token';

function respond(status: number, body: unknown) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }) as typeof fetch;
  return calls;
}

function client(): PasskeysClient {
  const http = new HttpClient({
    origin: '30m',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken(SESSION_JWT);
  return new PasskeysClient(http);
}

describe('PasskeysClient.createLink', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('posts the return URL and maps the link', async () => {
    const calls = respond(200, {
      token: 'link_token',
      url: LINK_URL,
      expires_in: '15m',
    });

    const link = await client().createLink({ returnUrl: RETURN_URL });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      'https://api.dev-bloque.app/api/origins/passkeys/links',
    );
    expect(calls[0]?.init?.method).toBe('POST');
    expect(new Headers(calls[0]?.init?.headers).get('Authorization')).toBe(
      `Bearer ${SESSION_JWT}`,
    );
    expect(JSON.parse(calls[0]?.init?.body as string)).toEqual({
      return_url: RETURN_URL,
    });
    expect(link).toEqual({ url: LINK_URL, expiresIn: '15m' });
  });

  it('throws BloqueReturnUrlNotAllowedError on E_RETURN_URL_NOT_ALLOWED', async () => {
    respond(400, {
      error: true,
      code: 'E_RETURN_URL_NOT_ALLOWED',
      message: 'E_RETURN_URL_NOT_ALLOWED',
    });

    const error = await client()
      .createLink({ returnUrl: 'https://evil.example.com' })
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueReturnUrlNotAllowedError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('E_RETURN_URL_NOT_ALLOWED');
  });

  it('marks E_PASSKEY_REGISTRATION_NOT_SUPPORTED as not retryable', async () => {
    respond(501, {
      error: true,
      code: 'E_PASSKEY_REGISTRATION_NOT_SUPPORTED',
      message: 'E_PASSKEY_REGISTRATION_NOT_SUPPORTED',
      extra_details: { retryable: false },
    });

    const error = await client()
      .createLink({ returnUrl: RETURN_URL })
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloquePasskeyRegistrationUnavailableError);
    expect(error.status).toBe(501);
    expect(error.retryable).toBe(false);
  });

  it('marks E_PASSKEY_REGISTRATION_UNAVAILABLE as retryable', async () => {
    respond(503, {
      error: true,
      code: 'E_PASSKEY_REGISTRATION_UNAVAILABLE',
      message: 'E_PASSKEY_REGISTRATION_UNAVAILABLE',
      extra_details: { retryable: true },
    });

    const error = await client()
      .createLink({ returnUrl: RETURN_URL })
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloquePasskeyRegistrationUnavailableError);
    expect(error.status).toBe(503);
    expect(error.retryable).toBe(true);
  });
});
