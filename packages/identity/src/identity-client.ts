import type { HttpClient } from '@bloque/sdk-core';
import { AliasesClient } from './aliases/aliases-client';
import { OriginsClient } from './origins/origins-client';
import type { IdentityMe } from './types';

export class IdentityClient {
  private readonly httpClient: HttpClient;
  readonly aliases: AliasesClient;
  readonly origins: OriginsClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.aliases = new AliasesClient(this.httpClient);
    this.origins = new OriginsClient(this.httpClient);
  }

  async me(): Promise<IdentityMe> {
    return await this.httpClient.request<IdentityMe>({
      method: 'GET',
      path: '/api/identities/me',
    });
  }
}
