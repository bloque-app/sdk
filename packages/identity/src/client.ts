import type { HttpClient } from '@bloque/sdk-core';
import { AliasesClient } from './aliases/client';

export class IdentityClient {
  private readonly httpClient: HttpClient;
  readonly aliases: AliasesClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.aliases = new AliasesClient(this.httpClient);
  }
}
