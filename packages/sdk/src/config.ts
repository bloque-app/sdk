import type { BloqueSDKConfig, HttpClient } from '@bloque/sdk-core';

const BLOQUE_SDK_STATE = Symbol.for('@bloque/sdk:state');

interface BloqueSDKState {
  config: BloqueSDKConfig | null;
  httpClient: HttpClient | null;
}

function getState(): BloqueSDKState {
  const globalThis_ = globalThis as typeof globalThis & {
    [BLOQUE_SDK_STATE]?: BloqueSDKState;
  };

  if (!globalThis_[BLOQUE_SDK_STATE]) {
    globalThis_[BLOQUE_SDK_STATE] = {
      config: null,
      httpClient: null,
    };
  }

  return globalThis_[BLOQUE_SDK_STATE];
}

export function setConfig(next: BloqueSDKConfig) {
  getState().config = next;
}

export function getConfig(): BloqueSDKConfig {
  const { config } = getState();
  if (!config) {
    throw new Error(
      '@bloque/sdk: SDK not initialized. Call init({ apiKey }) first.',
    );
  }
  return config;
}

export function setHttpClient(client: HttpClient) {
  getState().httpClient = client;
}

export function getHttpClient(): HttpClient {
  const { httpClient } = getState();
  if (!httpClient) {
    throw new Error(
      '@bloque/sdk: import "@bloque/sdk/init" before using any client.',
    );
  }
  return httpClient;
}
