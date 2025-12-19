import type { Mode } from './types';

export const API_BASE_URLS: Record<Mode, string> = {
  sandbox: 'https://dev.bloque.app',
  production: 'https://api.bloque.app',
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};
