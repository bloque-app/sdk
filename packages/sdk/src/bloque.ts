import { type BloqueConfig, HttpClient } from '@bloque/sdk-core';
import { OrgsClient } from '@bloque/sdk-orgs';

export class SDK {
  private readonly httpClient: HttpClient;
  public readonly orgs: OrgsClient;

  constructor(config: BloqueConfig) {
    this.httpClient = new HttpClient(config);
    this.orgs = new OrgsClient(this.httpClient);
  }
}
