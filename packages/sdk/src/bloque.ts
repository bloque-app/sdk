import { AccountsClient } from '@bloque/sdk-accounts';
import { ComplianceClient } from '@bloque/sdk-compliance';
import { type BloqueSDKConfig, HttpClient } from '@bloque/sdk-core';
import {
  type CreateIdentityParams,
  IdentityClient,
} from '@bloque/sdk-identity';
import { OrgsClient } from '@bloque/sdk-orgs';

export class SDK {
  private readonly httpClient: HttpClient;
  private readonly identity: IdentityClient;

  constructor(config: BloqueSDKConfig) {
    this.httpClient = new HttpClient(config);
    this.identity = new IdentityClient(this.httpClient);
  }

  private buildClients() {
    return {
      accounts: new AccountsClient(this.httpClient),
      compliance: new ComplianceClient(this.httpClient),
      identity: this.identity,
      orgs: new OrgsClient(this.httpClient),
    };
  }

  private getApiKey(): string {
    const { auth } = this.httpClient;
    return auth.type === 'apiKey' ? auth.apiKey : '';
  }

  private buildUrn(alias: string): string {
    const origin = this.httpClient.origin;
    if (!origin) {
      throw new Error('Origin is required to build a urn');
    }

    return `did:bloque:${origin}:${alias}`;
  }

  async register(alias: string, params: CreateIdentityParams) {
    if (!params.extraContext) params.extraContext = {};

    const urn = this.buildUrn(alias);
    const origin = this.httpClient.origin;

    const response = await this.identity.origins.register(urn, origin, {
      assertionResult: {
        alias: urn,
        challengeType: 'API_KEY',
        value: {
          apiKey: this.getApiKey(),
          alias: urn,
        },
      },
      ...params,
    });
    this.httpClient.setAccessToken(response.accessToken);
    this.httpClient.setUrn(urn);

    return this.buildClients();
  }

  async connect(alias: string) {
    const urn = this.buildUrn(alias);
    const origin = this.httpClient.origin;

    const response = await this.httpClient.request<{
      result: { access_token: string };
    }>({
      path: `/api/origins/${origin}/connect`,
      method: 'POST',
      body: {
        assertion_result: {
          challengeType: 'API_KEY',
          value: {
            api_key: this.getApiKey(),
            alias: urn,
          },
        },
        extra_context: {},
      },
    });

    this.httpClient.setAccessToken(response.result.access_token);
    this.httpClient.setUrn(urn);

    return this.buildClients();
  }
}
