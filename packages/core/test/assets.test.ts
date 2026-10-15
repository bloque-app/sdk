import { describe, expect, it } from 'bun:test';
import {
  isSupportedAsset,
  SUPPORTED_ASSETS,
  type SupportedAsset,
} from '../src/constants';

describe('supported assets', () => {
  it.each(['MXNB/2', 'BRLB/2'] as const)(
    'accepts the %s account asset',
    (asset) => {
      expect(isSupportedAsset(asset)).toBe(true);
      expect(SUPPORTED_ASSETS).toContain(asset);

      const supportedAsset: SupportedAsset = asset;
      expect(supportedAsset).toBe(asset);
    },
  );

  it.each(['MXN/2', 'BRL/2'])(
    'keeps the %s fiat rail asset outside account operations',
    (asset) => {
      expect(isSupportedAsset(asset)).toBe(false);
    },
  );
});
