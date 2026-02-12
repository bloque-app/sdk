import { AccountsClient } from '@bloque/sdk-accounts';
import { ComplianceClient } from '@bloque/sdk-compliance';
import { type BloqueSDKConfig, HttpClient } from '@bloque/sdk-core';
import {
  type CreateIdentityParams,
  IdentityClient,
  type IdentityMe,
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

  private requireOrigin(): string {
    const origin = this.httpClient.origin;
    if (!origin) {
      throw new Error('Origin is required for this operation');
    }
    return origin;
  }

  private buildOtpValue(
    alias: string,
    code: string,
  ): { code: string; phone?: string; email?: string } {
    const normalizedAlias = alias.trim();
    if (normalizedAlias.includes('@')) {
      return { code, email: normalizedAlias };
    }
    return { code, phone: normalizedAlias };
  }

  private assertJwtAuth(): void {
    if (this.httpClient.auth.type !== 'jwt') {
      throw new Error('This operation is only available for JWT auth');
    }
  }

  async assert(origin: string, alias: string) {
    this.assertJwtAuth();

    return await this.httpClient.request<{
      type: 'OTP';
      value: {
        phone?: string;
        email?: string;
        expires_at: number;
      };
      params: {
        attempts_remaining: number;
      };
    }>({
      path: `/api/origins/${origin}/assert?alias=${encodeURIComponent(alias)}`,
      method: 'GET',
    });
  }

  async authenticate() {
    const { auth } = this.httpClient;
    if (auth.type !== 'jwt') {
      throw new Error('authenticate is only available for JWT auth');
    }

    const token = this.httpClient.getJwtToken();
    if (!token?.trim()) {
      throw new Error('Authentication token is missing in tokenStorage');
    }

    this.httpClient.setJwtToken(token);

    const response = await this.identity.me();

    this.httpClient.setOrigin(response.origin);
    this.httpClient.setUrn(response.urn);

    return this.buildClients(token);
  }

  async me(): Promise<IdentityMe> {
    const response = await this.identity.me();
    return response;
  }

  async register(alias: string, params: CreateIdentityParams) {
    if (!params.extraContext) params.extraContext = {};

    const urn = this.buildUrn(alias);
    const origin = this.requireOrigin();

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

  async connect(alias: string): Promise<ReturnType<SDK['buildClients']>>;
  async connect(
    origin: string,
    alias: string,
    code: string,
  ): Promise<ReturnType<SDK['buildClients']>>;
  async connect(
    arg1: string,
    arg2?: string,
    arg3?: string,
  ): Promise<ReturnType<SDK['buildClients']>> {
    if (this.httpClient.auth.type === 'apiKey') {
      const alias = arg1;
      const urn = this.buildUrn(alias);
      const origin = this.requireOrigin();

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

    this.assertJwtAuth();
    if (!arg2 || !arg3) {
      throw new Error(
        'JWT connect requires origin and OTP code. Use connect(origin, alias, code)',
      );
    }

    const origin = arg1;
    const alias = arg2;
    const code = arg3;

    const response = await this.httpClient.request<{
      result: { access_token: string };
    }>({
      path: `/api/origins/${origin}/connect`,
      method: 'POST',
      body: {
        assertion_result: {
          challengeType: 'OTP',
          alias,
          value: this.buildOtpValue(alias, code),
        },
        extra_context: {},
      },
    });

    const urn = `did:bloque:${origin}:${alias}`;
    this.httpClient.setJwtToken(response.result.access_token);
    this.httpClient.setOrigin(origin);
    this.httpClient.setUrn(urn);

    return this.buildClients(response.result.access_token);
  }
}
