import { AccountsClient } from '@bloque/sdk-accounts';
import { ComplianceClient } from '@bloque/sdk-compliance';
import { type BloqueSDKConfig, HttpClient } from '@bloque/sdk-core';
import {
  type CreateIdentityParams,
  IdentityClient,
} from '@bloque/sdk-identity';
import { OrgsClient } from '@bloque/sdk-orgs';
import { SwapClient } from '@bloque/sdk-swap';

export class SDK {
  private readonly httpClient: HttpClient;
  private readonly identity: IdentityClient;

  constructor(config: BloqueSDKConfig) {
    this.httpClient = new HttpClient(config);
    this.identity = new IdentityClient(this.httpClient);
  }

  private buildClients(accessToken: string) {
    return {
      accounts: new AccountsClient(this.httpClient),
      compliance: new ComplianceClient(this.httpClient),
      identity: this.identity,
      orgs: new OrgsClient(this.httpClient),
      swap: new SwapClient(this.httpClient),
      urn: this.httpClient.urn,
      get accessToken(): string {
        return accessToken;
      },
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

  authenticateWithToken(token: string, alias: string) {
    if (!token?.trim()) {
      throw new Error('Token is required');
    }

    const { auth } = this.httpClient;
    if (auth.type !== 'jwt') {
      throw new Error('authenticateWithToken is only available for JWT auth');
    }

    this.httpClient.setJwtToken(token);
    this.httpClient.setUrn(this.buildUrn(alias));

    return this.buildClients(token);
  }

  async register(alias: string, params: CreateIdentityParams) {
    if (!params.extraContext) params.extraContext = {};

    const urn = this.buildUrn(alias);
    const origin = this.httpClient.origin;

    const response = await this.identity.origins.register(alias, origin, {
      assertionResult: {
        alias: alias,
        challengeType: 'API_KEY',
        value: {
          apiKey: this.getApiKey(),
          alias: alias,
        },
      },
      ...params,
    });

    this.httpClient.setAccessToken(response.accessToken);
    this.httpClient.setUrn(urn);

    return this.buildClients(response.accessToken);
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
            alias: alias,
          },
        },
        extra_context: {},
      },
    });

    this.httpClient.setAccessToken(response.result.access_token);
    this.httpClient.setUrn(urn);

    return this.buildClients(response.result.access_token);
  }
}
