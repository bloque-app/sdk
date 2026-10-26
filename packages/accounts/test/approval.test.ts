import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  ApprovalsClient,
  BloqueApprovalRequiredError,
  HttpClient,
  OPERATION_APPROVAL_HEADER,
  OPERATION_APPROVAL_RETURN_URL_HEADER,
  withApproval,
} from '@bloque/sdk-core';
import { AccountsClient } from '../src/accounts-client';
import { ExternalUsBankClient } from '../src/external-us-bank/external-us-bank-client';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function authedClient(): HttpClient {
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

const approvalRequired = () =>
  json(428, {
    error: true,
    code: 'E_APPROVAL_REQUIRED',
    message: 'E_APPROVAL_REQUIRED',
    extra_details: {
      approval_token: 'approval-token',
      expires_at: Date.now() + 60_000,
      approval_url:
        'https://api.bloque.app/api/origins/operation-approvals/approve#token=approval-token',
      summary: { operation: 'accounts.transfer', fields: {} },
    },
  });

const approvalReady = () =>
  json(200, {
    status: 'ready',
    header: OPERATION_APPROVAL_HEADER,
    value: 'signed-approval',
  });

type Call = {
  url: string;
  body: Record<string, unknown> | undefined;
  headers: Headers;
};

function mockFetch(responses: Array<() => Response>) {
  const calls: Call[] = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      headers: new Headers(init?.headers),
    });
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    return Promise.resolve(next());
  }) as unknown as typeof fetch;
  return calls;
}

const transferParams = {
  sourceUrn: 'did:bloque:account:virtual:acc-1',
  destinationUrn: 'did:bloque:account:virtual:acc-2',
  amount: '1000000',
  asset: 'DUSD/6' as const,
};

const transferOk = () =>
  json(200, {
    result: { queue_id: 'q_1', status: 'queued', message: 'queued' },
    req_id: 'req_1',
  });

describe('accounts.transfer approval', () => {
  it('throws a typed BloqueApprovalRequiredError on 428', async () => {
    mockFetch([approvalRequired]);
    const accounts = new AccountsClient(authedClient());

    const error = await accounts.transfer(transferParams).catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalRequiredError);
    expect(error.approvalUrl).toContain('/operation-approvals/approve');
  });

  it('withApproval waits for the approval and repeats the same transfer with it', async () => {
    const calls = mockFetch([approvalRequired, approvalReady, transferOk]);
    const accounts = new AccountsClient(authedClient());
    const onApprovalRequired = mock(() => {});

    const result = await withApproval(
      (approval) =>
        accounts.transfer(
          { ...transferParams, metadata: { reference: 'payment-1' } },
          { approval },
        ),
      { onApprovalRequired },
    );

    expect(result.queueId).toBe('q_1');
    expect(onApprovalRequired).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(3);
    expect(calls[0].headers.has(OPERATION_APPROVAL_HEADER)).toBe(false);
    expect(calls[1].url).toEndWith('/api/origins/operation-approvals/result');
    expect(calls[1].headers.get('Authorization')).toBe('Bearer approval-token');
    expect(calls[2].url).toBe(calls[0].url);
    expect(calls[2].body).toEqual(calls[0].body);
    expect(calls[2].headers.get(OPERATION_APPROVAL_HEADER)).toBe(
      'signed-approval',
    );
    expect(calls[2].headers.get('Authorization')).toBe(
      'Bearer test_access_token',
    );
  });
});

describe('accounts.transfer approval after a full-page redirect', () => {
  const RETURN_URL = 'https://app.example.com/transfers/back';

  it('sends the return URL, then resumes once with the collected approval', async () => {
    const calls = mockFetch([approvalRequired, approvalReady, transferOk]);
    const http = authedClient();
    const params = { ...transferParams, metadata: { reference: 'payment-1' } };

    const error = await new AccountsClient(http)
      .transfer(params, { approvalReturnUrl: RETURN_URL })
      .catch((e) => e);
    expect(error).toBeInstanceOf(BloqueApprovalRequiredError);
    // Saved before the redirect; the page is gone when the owner comes back.
    const saved = JSON.stringify({
      params,
      pending: error.toPendingApproval(),
    });

    const restored = JSON.parse(saved);
    const approval = await new ApprovalsClient(http).collect(restored.pending);
    const result = await new AccountsClient(http).transfer(restored.params, {
      approval,
      approvalReturnUrl: RETURN_URL,
    });

    expect(result.queueId).toBe('q_1');
    expect(calls).toHaveLength(3);
    expect(calls[0].headers.get(OPERATION_APPROVAL_RETURN_URL_HEADER)).toBe(
      RETURN_URL,
    );
    expect(calls[0].headers.has(OPERATION_APPROVAL_HEADER)).toBe(false);
    expect(calls[1].url).toEndWith('/api/origins/operation-approvals/result');
    expect(calls[2].url).toBe(calls[0].url);
    expect(calls[2].body).toEqual(calls[0].body);
    expect(calls[2].headers.get(OPERATION_APPROVAL_HEADER)).toBe(
      'signed-approval',
    );
    expect(calls[2].headers.has(OPERATION_APPROVAL_RETURN_URL_HEADER)).toBe(
      false,
    );
  });
});

describe('accounts.batchTransfer approval', () => {
  it('sends the approval header with the same batch body', async () => {
    const calls = mockFetch([
      () =>
        json(200, {
          result: {
            status: 'queued',
            chunks: [],
            total_operations: 1,
            total_chunks: 0,
          },
        }),
    ]);
    const accounts = new AccountsClient(authedClient());
    const params = {
      reference: 'batch-1',
      operations: [
        {
          fromUrn: 'did:bloque:account:virtual:acc-1',
          toUrn: 'did:bloque:account:virtual:acc-2',
          reference: 'op-1',
          amount: '100',
          asset: 'DUSD/6' as const,
        },
      ],
    };

    await accounts.batchTransfer(params, {
      idempotencyKey: 'batch-1',
      approvalReturnUrl: 'https://app.example.com',
    });
    await accounts.batchTransfer(params, {
      idempotencyKey: 'batch-1',
      approval: 'signed-approval',
    });

    expect(calls[1].url).toEndWith('/api/accounts/batch/transfer');
    expect(calls[1].body).toEqual(calls[0].body);
    expect(calls[0].headers.has(OPERATION_APPROVAL_HEADER)).toBe(false);
    expect(calls[1].headers.get(OPERATION_APPROVAL_HEADER)).toBe(
      'signed-approval',
    );
    expect(calls[0].headers.get(OPERATION_APPROVAL_RETURN_URL_HEADER)).toBe(
      'https://app.example.com',
    );
    expect(calls[1].headers.get('Idempotency-Key')).toBe('batch-1');
  });
});

describe('externalUsBank.pull approval', () => {
  it('sends the approval header with the same pull body', async () => {
    const calls = mockFetch([
      () =>
        json(200, {
          result: { order_sig: 'o', graph_id: 'g', status: 'pending' },
          req_id: 'r',
        }),
    ]);
    const bank = new ExternalUsBankClient(authedClient());
    const params = {
      urn: 'did:bloque:account:external-us-bank:acc-1',
      amount: '100.00',
      idempotencyKey: 'pull-1',
    };

    await bank.pull(params, { approvalReturnUrl: 'https://app.example.com' });
    await bank.pull(params, { approval: 'signed-approval' });

    expect(calls[1].url).toContain('/api/mediums/external-us-bank/');
    expect(calls[1].body).toEqual(calls[0].body);
    expect(calls[0].headers.has(OPERATION_APPROVAL_HEADER)).toBe(false);
    expect(calls[1].headers.get(OPERATION_APPROVAL_HEADER)).toBe(
      'signed-approval',
    );
    expect(calls[0].headers.get(OPERATION_APPROVAL_RETURN_URL_HEADER)).toBe(
      'https://app.example.com',
    );
    expect(calls[1].headers.get('Idempotency-Key')).toBe('pull-1');
  });
});
