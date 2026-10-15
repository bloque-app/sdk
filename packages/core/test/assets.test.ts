import { describe, expect, it } from 'bun:test';
import {
  isSupportedAsset,
  isSupportedCardAsset,
  SUPPORTED_ASSETS,
  SUPPORTED_CARD_ASSETS,
  type SupportedAsset,
  type SupportedCardAsset,
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

describe('supported card settlement assets', () => {
  it.each(['DUSD/6', 'COPB/6', 'COPM/2', 'KSM/12'] as const)(
    'accepts the existing %s card settlement asset',
    (asset) => {
      expect(isSupportedCardAsset(asset)).toBe(true);
      expect(SUPPORTED_CARD_ASSETS).toContain(asset);

      const supportedCardAsset: SupportedCardAsset = asset;
      expect(supportedCardAsset).toBe(asset);
    },
  );

  it.each(['MXNB/2', 'BRLB/2'])(
    'keeps the %s account asset outside card settlement configuration',
    (asset) => {
      expect(isSupportedCardAsset(asset)).toBe(false);
    },
  );
});
