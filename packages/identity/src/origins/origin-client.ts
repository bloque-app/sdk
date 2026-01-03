import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';

export class OriginClient<TAssertion> extends BaseClient {
  constructor(
    httpClient: HttpClient,
    private readonly origin: string,
  ) {
    super(httpClient);
  }

  async assert(alias: string): Promise<TAssertion> {
    return await this.httpClient.request<TAssertion>({
      method: 'GET',
      path: `/api/origins/${this.origin}/assert?alias=${alias}`,
    });
  }
}
