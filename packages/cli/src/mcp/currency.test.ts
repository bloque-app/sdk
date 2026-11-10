import { describe, expect, test } from 'bun:test';
import { humanizeMovement, resolveAsset, toHuman, toRaw } from './currency.ts';

describe('toRaw', () => {
  test('converts COPM to the precision-qualified asset ticker', () => {
    // Regression: COPM was missing from ASSET_MAP, so toRaw('COPM', ...)
    // fell through to a literal passthrough, sending "COPM" (no /2 suffix)
    // as fromAsset to findRates — which never matches any registered rate,
    // silently breaking every send_to_breb_key COPM cash-out.
    expect(toRaw('5050', 'COPM')).toEqual({
      amount: '505000',
      asset: 'COPM/2',
    });
  });

  test('is case-insensitive for COPM', () => {
    expect(toRaw('50', 'copm')).toEqual({ amount: '5000', asset: 'COPM/2' });
  });

  test('still converts COP and USD as before', () => {
    expect(toRaw('100', 'COP')).toEqual({ amount: '10000', asset: 'COP/2' });
    expect(toRaw('1.5', 'USD')).toEqual({ amount: '1500000', asset: 'DUSD/6' });
  });
});

describe('resolveAsset', () => {
  test('resolves COPM to COPM/2', () => {
    expect(resolveAsset('COPM')).toBe('COPM/2');
  });
});

describe('toHuman', () => {
  test('converts COPM/2 raw amounts back to human COPM', () => {
    expect(toHuman('505000', 'COPM/2')).toEqual({
      amount: '5050',
      currency: 'COPM',
    });
  });
});

describe('humanizeMovement', () => {
  test('humanizes the fee in its own asset', () => {
    expect(
      humanizeMovement({
        amount: '100000',
        asset: 'COPM/2',
        orderSig: 'order-1',
        fee: { amount: '50100', asset: 'COP/2' },
      }),
    ).toEqual({
      amount: '1000',
      currency: 'COPM',
      asset: 'COPM/2',
      orderSig: 'order-1',
      fee: { amount: '501', currency: 'COP' },
    });
  });

  test('adds no fee when the movement has none', () => {
    expect(humanizeMovement({ amount: '100', asset: 'COPM/2' })).not.toHaveProperty('fee');
  });
});
