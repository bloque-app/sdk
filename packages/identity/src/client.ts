import type { HttpClient } from '@bloque/sdk-core';
import { AliasesClient } from './aliases/client';
import { OriginsClient } from './origins/client';
import type { CreateIdentityParams } from './types';

export class IdentityClient {
  private readonly httpClient: HttpClient;
  readonly aliases: AliasesClient;
  readonly origins: OriginsClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.aliases = new AliasesClient(this.httpClient);
    this.origins = new OriginsClient(this.httpClient);
  }

  async create(params: CreateIdentityParams) {
    const origin = this.httpClient.config.origin;
    const alias = params.alias;
    Reflect.deleteProperty(params, 'alias');

    if (!params.extraContext) params.extraContext = {};

    return this.origins.register(origin, {
      assertionResult: {
        alias: alias,
        challengeType: 'API_KEY',
        value: {
          apiKey:
            this.httpClient.config.auth.type === 'apiKey'
              ? this.httpClient.config.auth.apiKey
              : '',
          alias: alias,
        },
      },
      ...params,
    });
  }
}
