import type { BloqueConfig } from '@bloque/sdk-core';

let config: BloqueConfig | null = null;

export function setConfig(next: BloqueConfig) {
  config = next;
}

export function getConfig(): BloqueConfig {
  if (!config) {
    throw new Error(
      '@bloque/sdk: SDK not initialized. Call init({ apiKey }) first.',
    );
  }
  return config;
}
