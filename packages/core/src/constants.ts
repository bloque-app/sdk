import type { Mode } from './types';

export const API_BASE_URLS: Record<Mode, string> = {
  sandbox: 'https://dev.bloque.app',
  production: 'https://api.bloque.app',
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Supported asset types for transfers and operations.
 * Format: SYMBOL/DECIMALS
 */
export const SUPPORTED_ASSETS = [
  'DUSD/6',
  'COPB/6',
  'COPM/2',
  'KSM/12',
] as const;

/**
 * Type representing a supported asset
 */
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];

/**
 * Check if a string is a supported asset
 */
export function isSupportedAsset(asset: string): asset is SupportedAsset {
  return SUPPORTED_ASSETS.includes(asset as SupportedAsset);
}
