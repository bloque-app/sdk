/**
 * Test helpers for the approval flow, in the style of the SDK's own approval
 * tests: real SDK clients over a mocked `fetch`.
 */
import { mock } from 'bun:test';
import {
  type BloqueClients,
  OPERATION_APPROVAL_HEADER,
  SDK,
} from '@bloque/sdk';

export type Call = {
  method: string;
  url: string;
  body: Record<string, unknown> | undefined;
  headers: Headers;
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const APPROVAL_URL =
  'https://api.bloque.app/api/origins/operation-approvals/approve#token=approval-token';

export const approvalRequired = (expiresInMs = 60_000) =>
  json(428, {
    error: true,
    code: 'E_APPROVAL_REQUIRED',
    message: 'E_APPROVAL_REQUIRED',
    extra_details: {
      approval_token: 'approval-token',
      expires_at: Date.now() + expiresInMs,
      approval_url: APPROVAL_URL,
      summary: { operation: 'accounts.transfer', fields: { amount: '1' } },
    },
  });

export const approvalPending = () => json(200, { status: 'pending' });

export const approvalReady = () =>
  json(200, {
    status: 'ready',
    header: OPERATION_APPROVAL_HEADER,
    value: 'signed-approval',
  });

export const approvalInvalid = () =>
  json(403, {
    error: true,
    code: 'E_APPROVAL_INVALID',
    message: 'E_APPROVAL_INVALID',
    extra_details: { reason: 'passkey_rejected' },
  });

export const transferOk = () =>
  json(200, {
    result: { queue_id: 'q_1', status: 'queued', message: 'queued' },
    req_id: 'req_1',
  });

const meOk = () =>
  json(200, { urn: 'did:bloque:test:holder', origin: 'test-origin' });

/**
 * Mocks `fetch`. `/api/identities/me` always answers; every other request
 * takes the next response from `responses` (the last one repeats).
 */
export function mockFetch(responses: Array<() => Response>): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    if (String(url).endsWith('/api/identities/me')) {
      return Promise.resolve(meOk());
    }
    calls.push({
      method: init?.method ?? 'GET',
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      headers: new Headers(init?.headers),
    });
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    if (!next) throw new Error('mockFetch: no responses');
    return Promise.resolve(next());
  }) as unknown as typeof fetch;
  return calls;
}

/** The `index`-th recorded call; fails the test when it was not made. */
export function callAt(calls: Call[], index: number): Call {
  const call = calls[index];
  if (!call) throw new Error(`expected call #${index}, got ${calls.length}`);
  return call;
}

/** Real clients, authenticated the way `bloque mcp` does with a JWT session. */
export async function testClients(): Promise<BloqueClients> {
  const sdk = new SDK({
    auth: { type: 'jwt' },
    mode: 'sandbox',
    origin: 'test-origin',
    retry: { enabled: false },
    tokenStorage: {
      get: () => 'test_access_token',
      set: () => {},
      clear: () => {},
    },
  });
  return await sdk.authenticate();
}

export const transferParams = {
  sourceUrn: 'did:bloque:account:virtual:acc-1',
  destinationUrn: 'did:bloque:account:virtual:acc-2',
  amount: '1000000',
  asset: 'DUSD/6' as const,
};
