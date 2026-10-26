import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  BloqueApprovalExpiredError,
  BloqueApprovalInvalidError,
  BloqueApprovalRequiredError,
  BloqueApprovalUnavailableError,
  BloqueConfigError,
  BloqueReturnUrlNotAllowedError,
  HttpClient,
  OPERATION_APPROVAL_HEADER,
} from '@bloque/sdk-core';
import { AccountsClient } from '../src/accounts-client';

/**
 * Every card, account and BRE-B key method that changes money routing, a
 * spending credential or an account takes the owner's passkey `approval` and
 * sends it as `x-bloque-operation-approval`, the same way `transfer` does,
 * and surfaces the API's 428 as a typed `BloqueApprovalRequiredError`.
 */

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const HOLDER = 'did:bloque:test-origin:alice';
const CARD = 'did:bloque:account:card:usr-1:crd-1';
const POCKET = 'did:bloque:account:virtual:acc-1';
const KEY = 'did:bloque:account:breb:key-1';

function client(): AccountsClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken('test_access_token');
  (http as unknown as { _config: { urn?: string } })._config.urn = HOLDER;
  return new AccountsClient(http);
}

const approvalRequired = () =>
  new Response(
    JSON.stringify({
      error: true,
      code: 'E_APPROVAL_REQUIRED',
      message: 'E_APPROVAL_REQUIRED',
      extra_details: {
        approval_token: 'approval-token',
        expires_at: Date.now() + 60_000,
        approval_url: 'https://id.bloque.sh/approve#token=approval-token',
        summary: { operation: 'accounts.update', fields: {} },
      },
    }),
    { status: 428, headers: { 'Content-Type': 'application/json' } },
  );

type Call = { url: string; method?: string; headers: Headers };

/** Every request answers 428; the calls record what was sent. */
function mockApprovalRequired(): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method,
      headers: new Headers(init?.headers),
    });
    return Promise.resolve(approvalRequired());
  }) as unknown as typeof fetch;
  return calls;
}

async function settle(promise: Promise<unknown>): Promise<unknown> {
  try {
    return await promise;
  } catch (error) {
    return error;
  }
}

const APPROVAL = 'signed-approval';

/** Each gated method, called with the approval. */
const GATED: Array<[string, (a: AccountsClient) => Promise<unknown>]> = [
  ['card.create', (a) => a.card.create({}, { approval: APPROVAL })],
  [
    'card.update (PIN)',
    (a) => a.card.update({ urn: CARD, pin: '1234' }, { approval: APPROVAL }),
  ],
  [
    'card.updateMetadata',
    (a) =>
      a.card.updateMetadata(
        { urn: CARD, metadata: { priority_mcc: ['5411'] } },
        { approval: APPROVAL },
      ),
  ],
  ['card.activate', (a) => a.card.activate(CARD, { approval: APPROVAL })],
  [
    'card.updateStatus',
    (a) =>
      a.card.updateStatus(CARD, 'active', undefined, { approval: APPROVAL }),
  ],
  ['card.delete', (a) => a.card.delete(CARD, { approval: APPROVAL })],
  [
    'card.tokenizeApple',
    (a) =>
      a.card.tokenizeApple(
        CARD,
        { certificates: ['c'], nonce: 'n', nonceSignature: 's' },
        { approval: APPROVAL },
      ),
  ],
  [
    'card.tokenizeGoogle',
    (a) =>
      a.card.tokenizeGoogle(
        CARD,
        { deviceId: 'd', walletAccountId: 'w' },
        { approval: APPROVAL },
      ),
  ],
  ['virtual.create', (a) => a.virtual.create({}, { approval: APPROVAL })],
  [
    'virtual.updateMetadata',
    (a) =>
      a.virtual.updateMetadata(
        { urn: POCKET, metadata: { name: 'x' } },
        { approval: APPROVAL },
      ),
  ],
  [
    'virtual.activate',
    (a) => a.virtual.activate(POCKET, { approval: APPROVAL }),
  ],
  ['virtual.delete', (a) => a.virtual.delete(POCKET, { approval: APPROVAL })],
  ['polygon.create', (a) => a.polygon.create({}, { approval: APPROVAL })],
  [
    'polygon.updateMetadata',
    (a) =>
      a.polygon.updateMetadata(
        { urn: POCKET, metadata: { name: 'x' } },
        { approval: APPROVAL },
      ),
  ],
  [
    'polygon.activate',
    (a) => a.polygon.activate(POCKET, { approval: APPROVAL }),
  ],
  ['polygon.delete', (a) => a.polygon.delete(POCKET, { approval: APPROVAL })],
  [
    'bancolombia.create',
    (a) => a.bancolombia.create({}, { approval: APPROVAL }),
  ],
  [
    'bancolombia.updateMetadata',
    (a) =>
      a.bancolombia.updateMetadata(
        { urn: POCKET, metadata: { name: 'x' } },
        { approval: APPROVAL },
      ),
  ],
  [
    'us.create',
    (a) =>
      a.us.create({ type: 'individual', address: {} } as never, {
        approval: APPROVAL,
      }),
  ],
  [
    'us.updateMetadata',
    (a) =>
      a.us.updateMetadata(
        { urn: POCKET, metadata: { name: 'x' } },
        { approval: APPROVAL },
      ),
  ],
  [
    'us2.create',
    (a) =>
      a.us2.create({ type: 'individual' } as never, { approval: APPROVAL }),
  ],
  [
    'externalUsBank.create',
    (a) =>
      a.externalUsBank.create({ label: 'Checking' }, { approval: APPROVAL }),
  ],
  [
    'bancolombia.activate',
    (a) => a.bancolombia.activate(POCKET, { approval: APPROVAL }),
  ],
  ['us.activate', (a) => a.us.activate(POCKET, { approval: APPROVAL })],
  [
    'externalUsBank.exchangePublicToken',
    (a) =>
      a.externalUsBank.exchangePublicToken(
        { urn: POCKET, publicToken: 'public-sandbox-token' },
        { approval: APPROVAL },
      ),
  ],
];

describe('card, account and BRE-B key approvals', () => {
  for (const [name, call] of GATED) {
    it(`${name}: sends the approval and throws BloqueApprovalRequiredError on 428`, async () => {
      const calls = mockApprovalRequired();
      const error = await settle(call(client()));
      expect(error).toBeInstanceOf(BloqueApprovalRequiredError);
      expect((error as BloqueApprovalRequiredError).approvalUrl).toBe(
        'https://id.bloque.sh/approve#token=approval-token',
      );
      expect(calls).toHaveLength(1);
      expect(calls[0]?.headers.get(OPERATION_APPROVAL_HEADER)).toBe(APPROVAL);
    });
  }

  it('sends no approval header when none is given', async () => {
    const calls = mockApprovalRequired();
    await settle(client().card.activate(CARD));
    expect(calls[0]?.headers.get(OPERATION_APPROVAL_HEADER)).toBeNull();
  });

  it('create keeps the Idempotency-Key next to the approval, so the repeat is the same request', async () => {
    const calls = mockApprovalRequired();
    await settle(
      client().card.create(
        {},
        { idempotencyKey: 'create-card-1', approval: APPROVAL },
      ),
    );
    expect(calls[0]?.headers.get('Idempotency-Key')).toBe('create-card-1');
    expect(calls[0]?.headers.get(OPERATION_APPROVAL_HEADER)).toBe(APPROVAL);
  });

  it('us2.create and externalUsBank.create now send their idempotencyKey', async () => {
    const calls = mockApprovalRequired();
    await settle(
      client().us2.create({ type: 'individual' } as never, {
        idempotencyKey: 'us2-1',
      }),
    );
    await settle(
      client().externalUsBank.create(
        { label: 'Checking' },
        { idempotencyKey: 'eub-1' },
      ),
    );
    expect(calls[0]?.headers.get('Idempotency-Key')).toBe('us2-1');
    expect(calls[1]?.headers.get('Idempotency-Key')).toBe('eub-1');
  });

  it('freeze and disable stay unapproved: a lost card is frozen at once', async () => {
    const calls = mockApprovalRequired();
    await settle(client().card.freeze(CARD));
    await settle(client().card.disable(CARD));
    for (const call of calls) {
      expect(call.headers.get(OPERATION_APPROVAL_HEADER)).toBeNull();
    }
  });
});

describe('BRE-B keys', () => {
  const KEYS: Array<[string, (a: AccountsClient) => Promise<unknown>]> = [
    [
      'createKey',
      (a) =>
        a.breb.createKey(
          { keyType: 'BCODE', key: '0016027228', ledgerId: 'ledger-1' },
          { approval: APPROVAL },
        ),
    ],
    [
      'activateKey',
      (a) => a.breb.activateKey({ accountUrn: KEY }, { approval: APPROVAL }),
    ],
    [
      'deleteKey',
      (a) => a.breb.deleteKey({ accountUrn: KEY }, { approval: APPROVAL }),
    ],
  ];

  for (const [name, call] of KEYS) {
    it(`${name}: a 428 is thrown as BloqueApprovalRequiredError, not returned as { error }`, async () => {
      const calls = mockApprovalRequired();
      const error = await settle(call(client()));
      expect(error).toBeInstanceOf(BloqueApprovalRequiredError);
      expect(calls[0]?.headers.get(OPERATION_APPROVAL_HEADER)).toBe(APPROVAL);
    });
  }

  for (const [code, status, type] of [
    ['E_APPROVAL_INVALID', 403, BloqueApprovalInvalidError],
    ['E_APPROVAL_EXPIRED', 403, BloqueApprovalExpiredError],
    ['E_APPROVAL_UNAVAILABLE', 503, BloqueApprovalUnavailableError],
  ] as const) {
    it(`${code} is thrown as a typed error too, from every key method`, async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: true,
              code,
              message: code,
              extra_details: { reason: 'x' },
            }),
            { status, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ) as unknown as typeof fetch;
      for (const [, call] of KEYS) {
        expect(await settle(call(client()))).toBeInstanceOf(type);
      }
    });
  }

  it('other errors are still returned as { error }, from every key method', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: true,
            code: 'E_KEY_TAKEN',
            message: 'taken',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ) as unknown as typeof fetch;
    for (const [, call] of KEYS) {
      const result = (await call(client())) as {
        data: unknown;
        error: { code: string | null } | null;
      };
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('E_KEY_TAKEN');
    }
  });

  it('throws a refused approvalReturnUrl instead of returning it', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: true,
            code: 'E_RETURN_URL_NOT_ALLOWED',
            message: 'E_RETURN_URL_NOT_ALLOWED',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ) as unknown as typeof fetch;
    const options = { approvalReturnUrl: 'https://evil.example.com' };
    const breb = client().breb;

    for (const call of [
      () => breb.createKey({ keyType: 'BCODE', key: '0016027228' }, options),
      () => breb.activateKey({ accountUrn: KEY }, options),
      () => breb.deleteKey({ accountUrn: KEY }, options),
    ]) {
      const error = await call().catch((e) => e);
      expect(error).toBeInstanceOf(BloqueReturnUrlNotAllowedError);
    }
  });

  it('throws a malformed approvalReturnUrl instead of returning it', async () => {
    const calls: unknown[] = [];
    globalThis.fetch = mock((...args: unknown[]) => {
      calls.push(args);
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof fetch;
    const options = { approvalReturnUrl: '/back' };
    const breb = client().breb;

    for (const call of [
      () => breb.createKey({ keyType: 'BCODE', key: '0016027228' }, options),
      () => breb.activateKey({ accountUrn: KEY }, options),
      () => breb.deleteKey({ accountUrn: KEY }, options),
    ]) {
      const error = await call().catch((e) => e);
      expect(error).toBeInstanceOf(BloqueConfigError);
    }
    expect(calls).toHaveLength(0);
  });

  it('other errors are still returned as { error }', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: true,
            code: 'E_KEY_TAKEN',
            message: 'taken',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ) as unknown as typeof fetch;
    const result = await client().breb.createKey({
      keyType: 'BCODE',
      key: '0016027228',
    });
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
  });
});
