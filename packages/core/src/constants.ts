import type { Mode } from './types';
import { SDK_NAME, SDK_VERSION } from './version';

export const API_BASE_URLS: Record<Mode, string> = {
  sandbox: 'https://api.dev-bloque.app',
  production: 'https://api.bloque.app',
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Bloque-SDK': `${SDK_NAME}@${SDK_VERSION}`,
};

/**
 * Supported asset types for transfers and operations.
 * Format: SYMBOL/DECIMALS
 */
export const SUPPORTED_ASSETS = [
  'DUSD/6',
  'COPB/6',
  'COPM/2',
  'MXNB/2',
  'BRLB/2',
  'KSM/12',
] as const;

/**
 * Assets supported for card settlement configuration.
 *
 * This is intentionally narrower than `SUPPORTED_ASSETS`: account balances,
 * transfers, and movement queries can support assets that the card processor
 * cannot use as settlement assets.
 */
export const SUPPORTED_CARD_ASSETS = [
  'DUSD/6',
  'COPB/6',
  'COPM/2',
  'KSM/12',
] as const;

/**
 * Type representing a supported asset
 */
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];

/** Type representing an asset supported for card settlement configuration. */
export type SupportedCardAsset = (typeof SUPPORTED_CARD_ASSETS)[number];

/**
 * Check if a string is a supported asset
 */
export function isSupportedAsset(asset: string): asset is SupportedAsset {
  return SUPPORTED_ASSETS.includes(asset as SupportedAsset);
}

/** Check if a string is supported for card settlement configuration. */
export function isSupportedCardAsset(
  asset: string,
): asset is SupportedCardAsset {
  return SUPPORTED_CARD_ASSETS.includes(asset as SupportedCardAsset);
}
