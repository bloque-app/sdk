import { describe, expect, test } from 'bun:test';
import { deterministicIdempotencyKey } from './idempotency.ts';

describe('deterministicIdempotencyKey', () => {
  test('is stable for identical params within the same time window', () => {
    const params = { sourceUrn: 'a', destinationUrn: 'b', amount: '5000', asset: 'COPM/2' };
    const key1 = deterministicIdempotencyKey('transfer', params);
    const key2 = deterministicIdempotencyKey('transfer', params);
    expect(key1).toBe(key2);
  });

  test('differs when any param differs', () => {
    const base = { sourceUrn: 'a', destinationUrn: 'b', amount: '5000', asset: 'COPM/2' };
    const changedAmount = { ...base, amount: '5001' };
    expect(deterministicIdempotencyKey('transfer', base)).not.toBe(
      deterministicIdempotencyKey('transfer', changedAmount),
    );
  });

  test('differs by operation name for otherwise-identical params', () => {
    const params = { sourceUrn: 'a', destinationUrn: 'b', amount: '5000' };
    expect(deterministicIdempotencyKey('transfer', params)).not.toBe(
      deterministicIdempotencyKey('fund_card', params),
    );
  });

  test('differs across time windows', () => {
    const params = { sourceUrn: 'a', destinationUrn: 'b', amount: '5000' };
    const key1 = deterministicIdempotencyKey('transfer', params, 5);
    // A 0-minute window buckets by the current millisecond, guaranteeing a
    // different bucket than a 5-minute window almost always would.
    const key2 = deterministicIdempotencyKey('transfer', params, 1 / 60_000);
    expect(key1).not.toBe(key2);
  });

  test('produces a 64-char hex sha256 digest', () => {
    const key = deterministicIdempotencyKey('transfer', { a: 1 });
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });
});
