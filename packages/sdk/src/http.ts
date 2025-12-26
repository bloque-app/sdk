import type { HttpClient } from '@bloque/sdk-core';

let httpClient: HttpClient | null = null;

export function setHttpClient(client: HttpClient) {
  httpClient = client;
}

export function getHttpClient(): HttpClient {
  if (!httpClient) {
    throw new Error(
      '@bloque/sdk: import "@bloque/sdk/init" before using any client.',
    );
  }
  return httpClient;
}
