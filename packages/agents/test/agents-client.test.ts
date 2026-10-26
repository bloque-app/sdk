import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  BloqueAPIError,
  BloqueAuthenticationError,
  BloqueNotFoundError,
  BloqueValidationError,
  HttpClient,
} from '@bloque/sdk-core';
import { AgentsClient } from '../src/agents-client';

const ACCESS_TOKEN = 'user_jwt_token';
const AGENT_URN = 'did:bloque:agent:550e8400-e29b-41d4-a716-446655440000';
const OWNER_URN = 'did:bloque:bloque-id:user-1';

function authedClient(): HttpClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken(ACCESS_TOKEN);
  return http;
}

function agentWire(overrides: Record<string, unknown> = {}) {
  return {
    urn: AGENT_URN,
    owner_urn: OWNER_URN,
    status: 'provisioning',
    display_name: 'Ada Lovelace',
    channels: {
      whatsapp: { status: 'unlinked', linked: false },
    },
    created_at: '2026-10-22T20:00:00.000Z',
    updated_at: '2026-10-22T20:00:00.000Z',
    ...overrides,
  };
}

function authorization(init?: RequestInit): string | undefined {
  const headers = init?.headers;
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return undefined;
  }
  return (headers as Record<string, string>).Authorization;
}

function header(
  init: RequestInit | undefined,
  name: string,
): string | undefined {
  const headers = init?.headers;
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return undefined;
  }
  return (headers as Record<string, string>)[name];
}

function captureFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return Promise.resolve(handler(String(url), init));
  }) as typeof fetch;
  return calls;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  status: number,
  code: string,
  extra?: Record<string, unknown>,
) {
  return jsonResponse(
    {
      error: true,
      code,
      message: code,
      path: '/api/agents',
      extra_details: extra ?? { message: code },
    },
    status,
  );
}

describe('AgentsClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('create POSTs /api/agents with no body, auth, and Idempotency-Key', async () => {
    const calls = captureFetch(() =>
      jsonResponse({ result: agentWire(), req_id: 'req_1' }, 202),
    );

    const result = await new AgentsClient(authedClient()).create();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('https://api.dev-bloque.app/api/agents');
    expect(calls[0]?.init?.method).toBe('POST');
    expect(authorization(calls[0]?.init)).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(header(calls[0]?.init, 'Idempotency-Key')).toBeDefined();
    expect(calls[0]?.init?.body).toBeUndefined();
    expect(result).toEqual({
      urn: AGENT_URN,
      ownerUrn: OWNER_URN,
      status: 'provisioning',
      displayName: 'Ada Lovelace',
      channels: { whatsapp: { status: 'unlinked', linked: false } },
      createdAt: '2026-10-22T20:00:00.000Z',
      updatedAt: '2026-10-22T20:00:00.000Z',
    });
    expect(result).not.toHaveProperty('secretKey');
    expect(result).not.toHaveProperty('apiKeyId');
    expect(result.channels.whatsapp).not.toHaveProperty('connectUrl');
  });

  it('create sends only a trimmed name and never phone or identity fields', async () => {
    const calls = captureFetch(() =>
      jsonResponse({ result: agentWire(), req_id: 'req_1' }, 202),
    );

    await new AgentsClient(authedClient()).create(
      { name: '  Ada  ' },
      { idempotencyKey: 'create-agent-1' },
    );

    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ name: 'Ada' });
    expect(header(calls[0]?.init, 'Idempotency-Key')).toBe('create-agent-1');
    const body = JSON.parse(String(calls[0]?.init?.body)) as Record<
      string,
      unknown
    >;
    expect(body).not.toHaveProperty('phone');
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('did');
    expect(body).not.toHaveProperty('owner_urn');
  });

  it('list GETs /api/agents and maps the list envelope', async () => {
    captureFetch(() =>
      jsonResponse({
        data: [agentWire({ status: 'ready' })],
        page_size: 1,
        has_more: false,
      }),
    );

    const result = await new AgentsClient(authedClient()).list();

    expect(result.pageSize).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.status).toBe('ready');
    expect(result.data[0]?.ownerUrn).toBe(OWNER_URN);
  });

  it('get GETs /api/agents/:urn and maps camelCase without secrets', async () => {
    const calls = captureFetch(() =>
      jsonResponse(
        agentWire({
          status: 'ready',
          secret_key: 'sk_should_not_leak',
          api_key_id: 'key_should_not_leak',
        }),
      ),
    );

    const result = await new AgentsClient(authedClient()).get(AGENT_URN);

    expect(calls[0]?.url).toBe(
      `https://api.dev-bloque.app/api/agents/${AGENT_URN}`,
    );
    expect(calls[0]?.init?.method).toBe('GET');
    expect(result.status).toBe('ready');
    expect(result).not.toHaveProperty('secretKey');
    expect(result).not.toHaveProperty('apiKeyId');
    expect(result).not.toHaveProperty('secret_key');
    expect(result).not.toHaveProperty('api_key_id');
  });

  it('whatsapp.get omits connect_url even if the payload includes one', async () => {
    const calls = captureFetch(() =>
      jsonResponse({
        channel: 'whatsapp',
        status: 'unlinked',
        linked: false,
        connect_url: 'https://example.invalid/should-not-surface',
        expires_at: null,
        updated_at: '2026-10-22T20:05:00.000Z',
      }),
    );

    const result = await new AgentsClient(authedClient()).whatsapp.get(
      AGENT_URN,
    );

    expect(calls[0]?.url).toBe(
      `https://api.dev-bloque.app/api/agents/${AGENT_URN}/channels/whatsapp`,
    );
    expect(result).toEqual({
      channel: 'whatsapp',
      status: 'unlinked',
      linked: false,
      expiresAt: null,
      updatedAt: '2026-10-22T20:05:00.000Z',
    });
    expect(result).not.toHaveProperty('connectUrl');
  });

  it('whatsapp.link POSTs { phone }, sends Idempotency-Key, and returns connectUrl', async () => {
    const calls = captureFetch(() =>
      jsonResponse(
        {
          result: {
            channel: 'whatsapp',
            status: 'link_pending',
            linked: false,
            connect_url: 'https://example.invalid/connect',
            expires_at: '2026-10-23T20:00:00.000Z',
          },
          req_id: 'req_2',
        },
        201,
      ),
    );

    const result = await new AgentsClient(authedClient()).whatsapp.link(
      AGENT_URN,
      { phone: '+573009998888' },
      { idempotencyKey: 'link-wa-1' },
    );

    expect(calls[0]?.url).toBe(
      `https://api.dev-bloque.app/api/agents/${AGENT_URN}/channels/whatsapp/link`,
    );
    expect(calls[0]?.init?.method).toBe('POST');
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      phone: '+573009998888',
    });
    expect(header(calls[0]?.init, 'Idempotency-Key')).toBe('link-wa-1');
    expect(result.status).toBe('link_pending');
    expect(result.connectUrl).toBe('https://example.invalid/connect');
    expect(result.expiresAt).toBe('2026-10-23T20:00:00.000Z');
  });

  it('maps E_AGENT_PHONE_INVALID (400) to BloqueValidationError', async () => {
    captureFetch(() =>
      errorResponse(400, 'E_AGENT_PHONE_INVALID', {
        message: 'phone must be E.164',
      }),
    );

    let error: unknown;
    try {
      await new AgentsClient(authedClient()).whatsapp.link(AGENT_URN, {
        phone: 'not-e164',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BloqueValidationError);
    expect((error as BloqueValidationError).code).toBe('E_AGENT_PHONE_INVALID');
    expect((error as BloqueValidationError).status).toBe(400);
    expect(
      (error as BloqueValidationError).response as {
        extra_details?: { message?: string };
      },
    ).toMatchObject({ extra_details: { message: 'phone must be E.164' } });
  });

  it('maps E_AGENT_NOT_FOUND (404) to BloqueNotFoundError', async () => {
    captureFetch(() => errorResponse(404, 'E_AGENT_NOT_FOUND'));

    let error: unknown;
    try {
      await new AgentsClient(authedClient()).get(AGENT_URN);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BloqueNotFoundError);
    expect((error as BloqueNotFoundError).code).toBe('E_AGENT_NOT_FOUND');
  });

  it('maps E_AGENT_FORBIDDEN (403) to BloqueAuthenticationError', async () => {
    captureFetch(() => errorResponse(403, 'E_AGENT_FORBIDDEN'));

    let error: unknown;
    try {
      await new AgentsClient(authedClient()).create();
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BloqueAuthenticationError);
    expect((error as BloqueAuthenticationError).code).toBe('E_AGENT_FORBIDDEN');
  });

  it('surfaces E_AGENT_NOT_READY (409) with the real code', async () => {
    captureFetch(() => errorResponse(409, 'E_AGENT_NOT_READY'));

    let error: unknown;
    try {
      await new AgentsClient(authedClient()).whatsapp.link(AGENT_URN, {
        phone: '+573009998888',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BloqueAPIError);
    expect((error as BloqueAPIError).status).toBe(409);
    expect((error as BloqueAPIError).code).toBe('E_AGENT_NOT_READY');
  });
});
