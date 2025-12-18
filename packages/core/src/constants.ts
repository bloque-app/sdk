import type { Mode } from './types';

export const API_BASE_URLS: Record<Mode, string> = {
  sandbox: 'https://api.sandbox.bloque.app',
  production: 'https://api.bloque.app',
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};
