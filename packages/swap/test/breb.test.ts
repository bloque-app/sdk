import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import { BrebClient } from '../src/breb/breb-client';
import type { BrebDestinationKey } from '../src/breb/types';

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
  http.setUrn('did:bloque:test:taker');
  return http;
}

function mockFetch() {
  const bodies: Array<Record<string, unknown>> = [];
  globalThis.fetch = mock(
    (_url: string | URL | Request, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            result: {
              order: {
                id: '1',
                order_sig: 'order-sig',
                rate_sig: 'rate-sig',
                swap_sig: 's',
                taker: 't',
                maker: 'm',
                from_asset: 'a',
                to_asset: 'b',
                from_medium: 'kusama',
                to_medium: 'breb',
                from_amount: '1',
                to_amount: '1',
                at: 'now',
                graph_id: 'g',
                status: 'pending',
              },
            },
            req_id: 'r',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    },
  ) as unknown as typeof fetch;
  return bodies;
}

async function createPayout(destinationKey: BrebDestinationKey) {
  const bodies = mockFetch();
  await new BrebClient(authedClient()).create({
    rateSig: 'rate-sig',
    amountSrc: '1000',
    depositInformation: { resolutionId: 'res-1', destinationKey },
    args: { sourceAccountUrn: 'did:bloque:account:virtual:acc-1' },
  });
  const depositInformation = bodies[0]?.deposit_information as {
    destination_key: Record<string, unknown>;
  };
  return depositInformation.destination_key;
}

describe('breb.create destination key', () => {
  it('omits key_type when keyType is not provided', async () => {
    const destinationKey = await createPayout({ keyValue: '@JAR1234' });

    expect(destinationKey).toEqual({ key_value: '@JAR1234' });
    expect('key_type' in destinationKey).toBe(false);
  });

  it('omits key_type when keyType is null', async () => {
    const destinationKey = await createPayout({
      keyValue: '@JAR1234',
      keyType: null,
    });

    expect('key_type' in destinationKey).toBe(false);
  });

  it('accepts a resolved key passed through as-is', async () => {
    // Same shape as accounts' BrebResolvedKey['key'].
    const resolved: { keyType: 'PHONE' | null; keyValue: string } = {
      keyType: null,
      keyValue: '@JAR1234',
    };
    const destinationKey = await createPayout({
      keyValue: resolved.keyValue,
      keyType: resolved.keyType,
    });

    expect(destinationKey).toEqual({ key_value: '@JAR1234' });
  });

  it('sends key_type when keyType is provided', async () => {
    const destinationKey = await createPayout({
      keyValue: '3001234567',
      keyType: 'PHONE',
      displayName: 'Camila',
    });

    expect(destinationKey).toEqual({
      key_value: '3001234567',
      key_type: 'PHONE',
      display_name: 'Camila',
    });
  });
});
