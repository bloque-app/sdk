import { afterEach, describe, expect, it, mock } from 'bun:test';
import { inspect } from 'node:util';
import {
  ApprovalsClient,
  OPERATION_APPROVAL_HEADER,
  OPERATION_APPROVAL_RETURN_URL_HEADER,
  operationApprovalHeaders,
  withApproval,
} from '../src/approvals';
import {
  BloqueApprovalAccountsNotReadyError,
  BloqueApprovalArgsRequiredError,
  BloqueApprovalExpiredError,
  BloqueApprovalInvalidError,
  BloqueApprovalMultipleOwnersError,
  BloqueApprovalPendingError,
  BloqueApprovalRequiredError,
  BloqueApprovalUnavailableError,
  BloqueConfigError,
  BloquePasskeyRegistrationUnavailableError,
  BloqueReturnUrlNotAllowedError,
  createBloqueError,
  type PendingApproval,
} from '../src/errors';
import { HttpClient } from '../src/http-client';

const originalFetch = globalThis.fetch;
const RESULT_PATH = '/api/origins/operation-approvals/result';
const TOKEN = 'approval-token-123';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function client(): HttpClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken('test_access_token');
  return http;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function approvalError(code: string, extra: Record<string, unknown>) {
  return { error: true, code, message: code, extra_details: extra };
}

function requiredBody(expiresAt = Date.now() + 60_000) {
  return approvalError('E_APPROVAL_REQUIRED', {
    approval_token: TOKEN,
    expires_at: expiresAt,
    approval_url: `https://api.bloque.app/api/origins/operation-approvals/approve#token=${TOKEN}`,
    summary: {
      operation: 'accounts.transfer',
      fields: { amount: '100', asset: 'DUSD/6' },
    },
  });
}

type Call = { url: string; method?: string; headers: Headers };

function mockFetch(responses: Array<() => Response>) {
  const calls: Call[] = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method,
      headers: new Headers(init?.headers),
    });
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    return Promise.resolve(next());
  }) as unknown as typeof fetch;
  return calls;
}

/** A client without a request timeout, so a hanging fetch leaves no timer. */
function hangingClient(): HttpClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    timeout: 0,
    retry: { enabled: false },
  });
  http.setAccessToken('test_access_token');
  return http;
}

function hangingFetch() {
  globalThis.fetch = mock(
    () => new Promise<Response>(() => {}),
  ) as unknown as typeof fetch;
}

function requiredError(
  http: HttpClient,
  expiresAt?: number,
): BloqueApprovalRequiredError {
  return createBloqueError('E_APPROVAL_REQUIRED', {
    status: 428,
    code: 'E_APPROVAL_REQUIRED',
    response: requiredBody(expiresAt),
    httpClient: http,
  }) as BloqueApprovalRequiredError;
}

describe('approval errors', () => {
  it('maps a 428 E_APPROVAL_REQUIRED response to BloqueApprovalRequiredError', async () => {
    const expiresAt = Date.now() + 60_000;
    mockFetch([() => json(428, requiredBody(expiresAt))]);

    const error = await client()
      .request({ method: 'POST', path: '/api/accounts/x/transfer', body: {} })
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalRequiredError);
    expect(error.status).toBe(428);
    expect(error.code).toBe('E_APPROVAL_REQUIRED');
    expect(error.approvalUrl).toContain(`#token=${TOKEN}`);
    expect(error.expiresAt.getTime()).toBe(expiresAt);
    expect(error.summary).toEqual({
      operation: 'accounts.transfer',
      fields: { amount: '100', asset: 'DUSD/6' },
    });
  });

  it('keeps the approval token out of logs', () => {
    const error = requiredError(client());
    const logged = JSON.stringify(error.toJSON());

    expect(logged).not.toContain(TOKEN);
    expect(Object.keys(error)).not.toContain('approvalToken');
    expect(JSON.stringify(error.response)).not.toContain(TOKEN);
  });

  it('keeps the approval token out of inspected or spread errors', () => {
    const error = requiredError(client());

    expect(error.approvalUrl).toContain(`#token=${TOKEN}`);
    expect(inspect(error, { depth: 10 })).not.toContain(TOKEN);
    expect(JSON.stringify(Object.assign({}, error))).not.toContain(TOKEN);
    expect(JSON.stringify({ ...error })).not.toContain(TOKEN);
  });

  it.each([
    [
      403,
      'E_APPROVAL_INVALID',
      { reason: 'passkey_rejected' },
      BloqueApprovalInvalidError,
    ],
    [
      403,
      'E_APPROVAL_EXPIRED',
      { reason: 'approval_token_expired' },
      BloqueApprovalExpiredError,
    ],
    [
      503,
      'E_APPROVAL_UNAVAILABLE',
      { reason: 'passkey_verification_unavailable' },
      BloqueApprovalUnavailableError,
    ],
    [
      422,
      'E_APPROVAL_MULTIPLE_OWNERS',
      { reason: 'batch_debits_multiple_approving_owners' },
      BloqueApprovalMultipleOwnersError,
    ],
    [
      422,
      'E_APPROVAL_ACCOUNTS_NOT_READY',
      { reason: 'batch_has_accounts_in_creation' },
      BloqueApprovalAccountsNotReadyError,
    ],
  ] as const)(
    'maps %i %s to its typed error',
    async (status, code, extra, ErrorClass) => {
      mockFetch([() => json(status, approvalError(code, extra))]);

      const error = await client()
        .request({ method: 'POST', path: '/api/accounts/x/transfer', body: {} })
        .catch((e) => e);

      expect(error).toBeInstanceOf(ErrorClass);
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
      expect(error.reason).toBe(extra.reason);
    },
  );

  it('tells the owner to re-register on passkey_not_registered', () => {
    const error = createBloqueError('E_APPROVAL_INVALID', {
      status: 403,
      code: 'E_APPROVAL_INVALID',
      response: approvalError('E_APPROVAL_INVALID', {
        reason: 'passkey_not_registered',
        message:
          'This passkey is not registered for approvals. Register it again, then approve the operation.',
      }),
    }) as BloqueApprovalInvalidError;

    expect(error.reason).toBe('passkey_not_registered');
    expect(error.message).toContain('Register it again');
  });

  it('exposes the missing args on E_APPROVAL_ARGS_REQUIRED', () => {
    const error = createBloqueError('E_APPROVAL_ARGS_REQUIRED', {
      status: 422,
      code: 'E_APPROVAL_ARGS_REQUIRED',
      response: approvalError('E_APPROVAL_ARGS_REQUIRED', {
        reason: 'first_node_args_required',
        args: ['account_urn'],
      }),
    }) as BloqueApprovalArgsRequiredError;

    expect(error).toBeInstanceOf(BloqueApprovalArgsRequiredError);
    expect(error.args).toEqual(['account_urn']);
  });
});

describe('BloqueApprovalRequiredError.waitForApproval()', () => {
  it('polls the result route with the approval token and returns the header value', async () => {
    const http = new HttpClient({
      auth: { type: 'apiKey', apiKey: 'sk_test_abc' },
      mode: 'sandbox',
      retry: { enabled: false },
    });
    const calls = mockFetch([
      () =>
        json(200, {
          status: 'ready',
          header: OPERATION_APPROVAL_HEADER,
          value: 'signed',
        }),
    ]);

    const approval = await requiredError(http).waitForApproval();

    expect(approval).toBe('signed');
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toEndWith(RESULT_PATH);
    expect(calls[0].headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
  });

  it('keeps polling on delivered, never faster than every 2s', async () => {
    const calls = mockFetch([
      () => json(200, { status: 'delivered' }),
      () =>
        json(200, {
          status: 'ready',
          header: OPERATION_APPROVAL_HEADER,
          value: 'signed',
        }),
    ]);
    const started = Date.now();

    const approval = await requiredError(client()).waitForApproval({
      intervalMs: 10,
    });

    expect(approval).toBe('signed');
    expect(calls).toHaveLength(2);
    expect(Date.now() - started).toBeGreaterThanOrEqual(1900);
  });

  it('stops at expiresAt with BloqueApprovalExpiredError', async () => {
    const calls = mockFetch([() => json(200, { status: 'pending' })]);

    const error = await requiredError(client(), Date.now() + 200)
      .waitForApproval()
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
    expect(calls).toHaveLength(1);
  });

  it('does not poll an already expired approval', async () => {
    const calls = mockFetch([() => json(200, { status: 'pending' })]);

    const error = await requiredError(client(), Date.now() - 1)
      .waitForApproval()
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
    expect(calls).toHaveLength(0);
  });

  it.each([Number.NaN, -1, Number.POSITIVE_INFINITY])(
    'keeps the 2s floor for intervalMs %p',
    async (intervalMs) => {
      const calls = mockFetch([() => json(200, { status: 'pending' })]);

      const error = await requiredError(client(), Date.now() + 500)
        .waitForApproval({ intervalMs })
        .catch((e) => e);

      expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
      expect(calls).toHaveLength(1);
    },
  );

  it('cuts an in-flight poll on abort', async () => {
    hangingFetch();
    const controller = new AbortController();
    setTimeout(() => controller.abort(new Error('stop')), 100);
    const started = Date.now();

    const error = await requiredError(hangingClient())
      .waitForApproval({ signal: controller.signal })
      .catch((e) => e);

    expect(error.message).toBe('stop');
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('cuts an in-flight poll at expiresAt', async () => {
    hangingFetch();
    const started = Date.now();

    const error = await requiredError(hangingClient(), Date.now() + 200)
      .waitForApproval()
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('reports an approval collected elsewhere with its own reason', async () => {
    mockFetch([() => json(200, { status: 'delivered' })]);

    const error = await requiredError(client(), Date.now() + 200)
      .waitForApproval()
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
    expect(error.reason).toBe('approval_delivered_elsewhere');
  });

  it('honors the abort signal', async () => {
    mockFetch([() => json(200, { status: 'pending' })]);
    const controller = new AbortController();
    setTimeout(() => controller.abort(new Error('stop')), 50);
    const started = Date.now();

    const error = await requiredError(client())
      .waitForApproval({ signal: controller.signal })
      .catch((e) => e);

    expect(error.message).toBe('stop');
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('surfaces a typed error from the result route', async () => {
    mockFetch([
      () =>
        json(
          403,
          approvalError('E_APPROVAL_EXPIRED', {
            reason: 'approval_token_expired',
          }),
        ),
    ]);

    const error = await requiredError(client())
      .waitForApproval()
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
  });
});

describe('withApproval()', () => {
  it('waits for the approval and repeats the call exactly once with it', async () => {
    const http = client();
    mockFetch([
      () =>
        json(200, {
          status: 'ready',
          header: OPERATION_APPROVAL_HEADER,
          value: 'signed',
        }),
    ]);
    const run = mock(async (approval?: string) => {
      if (!approval) throw requiredError(http);
      return { ok: true, approval };
    });
    const onApprovalRequired = mock(() => {});

    const result = await withApproval(run, { onApprovalRequired });

    expect(result).toEqual({ ok: true, approval: 'signed' });
    expect(run).toHaveBeenCalledTimes(2);
    expect(onApprovalRequired).toHaveBeenCalledTimes(1);
  });

  it('throws a second BloqueApprovalRequiredError instead of looping', async () => {
    const http = client();
    mockFetch([
      () =>
        json(200, {
          status: 'ready',
          header: OPERATION_APPROVAL_HEADER,
          value: 'signed',
        }),
    ]);
    const run = mock(async () => {
      throw requiredError(http);
    });

    const error = await withApproval(run, {
      onApprovalRequired: () => {},
    }).catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalRequiredError);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('passes other errors through without waiting', async () => {
    const run = mock(async () => {
      throw new BloqueApprovalUnavailableError('', { status: 503 });
    });
    const onApprovalRequired = mock(() => {});

    const error = await withApproval(run, { onApprovalRequired }).catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(BloqueApprovalUnavailableError);
    expect(run).toHaveBeenCalledTimes(1);
    expect(onApprovalRequired).not.toHaveBeenCalled();
  });
});

describe('operationApprovalHeaders()', () => {
  it('sets only the headers it is given', () => {
    expect(operationApprovalHeaders()).toEqual({});
    expect(
      operationApprovalHeaders({ idempotencyKey: 'k', approval: 'signed' }),
    ).toEqual({
      'Idempotency-Key': 'k',
      [OPERATION_APPROVAL_HEADER]: 'signed',
    });
  });

  it('sends the approval return URL on the first request', () => {
    expect(
      operationApprovalHeaders({ approvalReturnUrl: 'https://app.test/back' }),
    ).toEqual({
      [OPERATION_APPROVAL_RETURN_URL_HEADER]: 'https://app.test/back',
    });
  });

  it('percent-encodes a non-ASCII approval return URL for the header', () => {
    expect(
      operationApprovalHeaders({
        approvalReturnUrl: 'https://app.test/pagos/año?nota=sí',
      }),
    ).toEqual({
      [OPERATION_APPROVAL_RETURN_URL_HEADER]:
        'https://app.test/pagos/a%C3%B1o?nota=s%C3%AD',
    });
  });

  it.each([
    '/relative/path',
    'https://app.test/a\tb',
    'https://app.test/a\nb',
    ' https://app.test/back',
    'https://app.test/a b',
  ])('refuses %p as an approval return URL instead of changing it', (url) => {
    expect(() => operationApprovalHeaders({ approvalReturnUrl: url })).toThrow(
      BloqueConfigError,
    );
  });

  it('sends a header-safe approval return URL unchanged', () => {
    expect(
      operationApprovalHeaders({ approvalReturnUrl: 'https://app.test' }),
    ).toEqual({ [OPERATION_APPROVAL_RETURN_URL_HEADER]: 'https://app.test' });
  });

  it('drops the approval return URL when repeating with the approval', () => {
    expect(
      operationApprovalHeaders({
        approval: 'signed',
        approvalReturnUrl: 'https://app.test/back',
      }),
    ).toEqual({ [OPERATION_APPROVAL_HEADER]: 'signed' });
  });

  it('maps a 400 E_RETURN_URL_NOT_ALLOWED to BloqueReturnUrlNotAllowedError', async () => {
    mockFetch([
      () =>
        json(400, {
          error: true,
          code: 'E_RETURN_URL_NOT_ALLOWED',
          message: 'E_RETURN_URL_NOT_ALLOWED',
        }),
    ]);

    const error = await client()
      .request({ method: 'POST', path: '/api/accounts/x/transfer', body: {} })
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueReturnUrlNotAllowedError);
    expect(error.status).toBe(400);
  });
});

describe('redirect resume', () => {
  async function pendingFromRequired(
    expiresAt = Date.now() + 60_000,
  ): Promise<PendingApproval> {
    mockFetch([() => json(428, requiredBody(expiresAt))]);
    const error = await client()
      .request({ method: 'POST', path: '/api/accounts/x/transfer', body: {} })
      .catch((e) => e);
    // What an integrator saves in sessionStorage before the redirect.
    return JSON.parse(JSON.stringify(error.toPendingApproval()));
  }

  it('toPendingApproval() throws when the 428 carried no approval token', () => {
    const error = createBloqueError('E_APPROVAL_REQUIRED', {
      status: 428,
      code: 'E_APPROVAL_REQUIRED',
      response: approvalError('E_APPROVAL_REQUIRED', {
        expires_at: Date.now() + 60_000,
      }),
    }) as BloqueApprovalRequiredError;

    expect(() => error.toPendingApproval()).toThrow(BloqueApprovalExpiredError);
  });

  it('toPendingApproval() keeps what collect() needs as plain JSON', async () => {
    const expiresAt = Date.now() + 60_000;
    const pending = await pendingFromRequired(expiresAt);

    expect(pending).toEqual({
      approvalToken: TOKEN,
      approvalUrl: `https://api.bloque.app/api/origins/operation-approvals/approve#token=${TOKEN}`,
      expiresAt,
      summary: {
        operation: 'accounts.transfer',
        fields: { amount: '100', asset: 'DUSD/6' },
      },
    });
  });

  it('collect() reads the result once and returns the approval', async () => {
    const pending = await pendingFromRequired();
    const calls = mockFetch([
      () =>
        json(200, {
          status: 'ready',
          header: OPERATION_APPROVAL_HEADER,
          value: 'signed',
        }),
    ]);

    const approval = await new ApprovalsClient(client()).collect(pending);

    expect(approval).toBe('signed');
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toEndWith(RESULT_PATH);
    expect(calls[0].headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
  });

  it('collect() throws BloqueApprovalPendingError when not approved yet', async () => {
    const pending = await pendingFromRequired();
    const calls = mockFetch([() => json(200, { status: 'pending' })]);

    const error = await new ApprovalsClient(client())
      .collect(pending)
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalPendingError);
    expect(error.code).toBe('E_APPROVAL_PENDING');
    expect(calls).toHaveLength(1);
  });

  it('collect() refuses an approval already collected', async () => {
    const pending = await pendingFromRequired();
    mockFetch([() => json(200, { status: 'delivered' })]);

    const error = await new ApprovalsClient(client())
      .collect(pending)
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
    expect(error.reason).toBe('approval_delivered_elsewhere');
  });

  it('collect() does not call the API for an expired approval', async () => {
    const pending = await pendingFromRequired(Date.now() - 1);
    const calls = mockFetch([() => json(200, { status: 'pending' })]);

    const error = await new ApprovalsClient(client())
      .collect(pending)
      .catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalExpiredError);
    expect(error.reason).toBe('approval_not_received');
    expect(calls).toHaveLength(0);
  });
});

describe('HttpClient retries', () => {
  it('retries 503 E_APPROVAL_UNAVAILABLE, then surfaces it typed', async () => {
    const http = new HttpClient({
      origin: 'test-origin',
      auth: { type: 'originKey', originKey: 'sk_dev_origin' },
      mode: 'sandbox',
      retry: { enabled: true, maxRetries: 1, initialDelay: 0, maxDelay: 0 },
    });
    http.setAccessToken('test_access_token');
    const calls = mockFetch([
      () =>
        json(
          503,
          approvalError('E_APPROVAL_UNAVAILABLE', {
            reason: 'passkey_verification_unavailable',
          }),
        ),
    ]);

    const error = await http
      .request({ method: 'POST', path: '/api/accounts/x/transfer', body: {} })
      .catch((e) => e);

    expect(calls).toHaveLength(2);
    expect(error).toBeInstanceOf(BloqueApprovalUnavailableError);
    expect(error.reason).toBe('passkey_verification_unavailable');
  });

  function retryingClient(): HttpClient {
    const http = new HttpClient({
      origin: 'test-origin',
      auth: { type: 'originKey', originKey: 'sk_dev_origin' },
      mode: 'sandbox',
      retry: { enabled: true, maxRetries: 2, initialDelay: 0, maxDelay: 0 },
    });
    http.setAccessToken('test_access_token');
    return http;
  }

  it('does not retry a 503 the API marks retryable: false', async () => {
    const calls = mockFetch([
      () =>
        json(
          503,
          approvalError('E_PASSKEY_REGISTRATION_UNAVAILABLE', {
            retryable: false,
          }),
        ),
    ]);

    const error = await retryingClient()
      .request({
        method: 'POST',
        path: '/api/origins/passkeys/links',
        body: {},
      })
      .catch((e) => e);

    expect(calls).toHaveLength(1);
    expect(error).toBeInstanceOf(BloquePasskeyRegistrationUnavailableError);
    expect(error.retryable).toBe(false);
  });

  it('retries a 503 without extra_details', async () => {
    const calls = mockFetch([
      () =>
        json(503, {
          error: true,
          code: 'E_PASSKEY_REGISTRATION_UNAVAILABLE',
          message: 'E_PASSKEY_REGISTRATION_UNAVAILABLE',
        }),
    ]);

    const error = await retryingClient()
      .request({
        method: 'POST',
        path: '/api/origins/passkeys/links',
        body: {},
      })
      .catch((e) => e);

    expect(calls).toHaveLength(3);
    expect(error).toBeInstanceOf(BloquePasskeyRegistrationUnavailableError);
    expect(error.retryable).toBe(true);
  });
});
