import type { HttpClient } from '@bloque/sdk-core';

import type { Alias } from './types';

export class AliasesClient {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async get(alias: string): Promise<Alias> {
    const response = await this.httpClient.request<Alias>({
      method: 'GET',
      path: `/api/aliases?alias=${alias}`,
    });
    return response;
  }
}
