import { AccountsClient } from '@bloque/sdk-accounts';
import { ComplianceClient } from '@bloque/sdk-compliance';
import { type BloqueConfig, HttpClient } from '@bloque/sdk-core';
import { IdentityClient } from '@bloque/sdk-identity';
import { OrgsClient } from '@bloque/sdk-orgs';

export class SDK {
  private readonly httpClient: HttpClient;

  constructor(config: BloqueConfig) {
    this.httpClient = new HttpClient(config);
  }

  private extractUserAlias(urn: string): string {
    const match = urn.match(/^did:bloque:[^:]+:([^:]+)$/);

    if (!match) {
      throw new Error(`Invalid user alias URN: ${urn}`);
    }

    return match[1];
  }

  async connect(urn: string) {
    const config = this.httpClient.config;
    config.urn = urn;
    const response = await this.httpClient.request({
      path: `/api/origins/${config.origin}/connect`,
      method: 'POST',
      body: {
        assertion_result: {
          challengeType: 'API_KEY',
          value: {
            api_key: config.auth.type === 'apiKey' ? config.auth.apiKey : '',
            alias: this.extractUserAlias(urn),
          },
        },
        extra_context: {},
      },
    });
    config.accessToken = (response as any).result.access_token;

    return {
      accounts: new AccountsClient(this.httpClient),
      compliance: new ComplianceClient(this.httpClient),
      identity: new IdentityClient(this.httpClient),
      orgs: new OrgsClient(this.httpClient),
    };
  }
}
