import { AccountsClient } from '@bloque/sdk-accounts';
import { ComplianceClient } from '@bloque/sdk-compliance';
import { type BloqueSDKConfig, HttpClient } from '@bloque/sdk-core';
import {
  type CreateIdentityParams,
  IdentityClient,
  type IdentityMe,
  type OriginMetadataPatch,
  type UpdateOriginMetadataResult,
} from '@bloque/sdk-identity';
import { OrgsClient } from '@bloque/sdk-orgs';
import { SwapClient } from '@bloque/sdk-swap';

export interface UpdateOriginMetadataOptions {
  /**
   * Origin namespace to patch. Defaults to the SDK's configured `origin` —
   * only pass this to target a *different* origin than the one this SDK
   * instance is otherwise configured for.
   */
  originName?: string;
  /**
   * The origin's own provisioned secret key. Defaults to the configured
   * `apiKey`/`originKey` auth credential — only pass this if `originName`
   * is overridden too, or your own credential differs from the origin
   * being patched.
   */
  apiKey?: string;
  metadata: OriginMetadataPatch;
}

export interface BloqueClients {
  accounts: AccountsClient;
  compliance: ComplianceClient;
  identity: IdentityClient;
  orgs: OrgsClient;
  swap: SwapClient;
  urn: string | undefined;
  readonly accessToken: string;
}

export class SDK {
  private readonly httpClient: HttpClient;
  private readonly identity: IdentityClient;

  constructor(config: BloqueSDKConfig) {
    this.httpClient = new HttpClient(config);
    this.identity = new IdentityClient(this.httpClient);
  }

  private buildClients(
    httpClient: HttpClient,
    accessToken: string,
  ): BloqueClients {
    return {
      accounts: new AccountsClient(httpClient),
      compliance: new ComplianceClient(httpClient),
      identity: new IdentityClient(httpClient),
      orgs: new OrgsClient(httpClient),
      swap: new SwapClient(httpClient),
      urn: httpClient.urn,
      get accessToken(): string {
        return accessToken;
      },
    };
  }

  private getOriginKey(): string {
    const { auth } = this.httpClient;
    return auth.type === 'originKey' ? auth.originKey : '';
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

    const response = await this.identity.me();

    this.httpClient.setOrigin(response.origin);
    this.httpClient.setUrn(response.urn);

    return this.buildClients(
      this.httpClient,
      this.httpClient.getJwtToken() ?? '',
    );
  }

  async me(): Promise<IdentityMe> {
    const response = await this.identity.me();
    return response;
  }

  async register(alias: string, params: CreateIdentityParams) {
    if (this.httpClient.auth.type !== 'originKey') {
      throw new Error('register() is only available for originKey auth');
    }

    if (!params.extraContext) params.extraContext = {};

    const urn = this.buildUrn(alias);
    const origin = this.requireOrigin();

    const response = await this.identity.origins.register(alias, origin, {
      assertionResult: {
        alias: alias,
        challengeType: 'API_KEY',
        value: {
          apiKey: this.getOriginKey(),
          alias: alias,
        },
      },
      ...params,
    });

    const session = this.httpClient.fork();
    session.setAccessToken(response.accessToken);
    session.setUrn(urn);

    return this.buildClients(session, response.accessToken);
  }

  async connect(): Promise<BloqueClients>;
  async connect(options: { scopes?: string[] }): Promise<BloqueClients>;
  async connect(alias: string): Promise<BloqueClients>;
  async connect(
    origin: string,
    alias: string,
    code: string,
  ): Promise<BloqueClients>;
  async connect(
    arg1?: string | { scopes?: string[] },
    arg2?: string,
    arg3?: string,
  ): Promise<BloqueClients> {
    const authType = this.httpClient.auth.type;

    // --- apiKey: exchange sk_ key for JWT, resolve identity via /me ---
    if (authType === 'apiKey') {
      if (typeof arg1 === 'string') {
        throw new Error(
          'connect() takes no alias for apiKey auth. Use connect() or connect({ scopes })',
        );
      }

      await this.httpClient.ensureExchanged();

      const session = this.httpClient.fork();
      const me = await new IdentityClient(session).me();
      session.setOrigin(me.origin);
      session.setUrn(me.urn);

      return this.buildClients(session, session.accessToken ?? '');
    }

    // --- originKey: legacy API_KEY challenge connect(alias) ---
    if (authType === 'originKey') {
      if (!arg1 || typeof arg1 !== 'string') {
        throw new Error('connect(alias) is required for originKey auth');
      }

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
              api_key: this.getOriginKey(),
              alias: alias,
            },
          },
          extra_context: {},
        },
      });

      const session = this.httpClient.fork();
      session.setAccessToken(response.result.access_token);
      session.setUrn(urn);

      return this.buildClients(session, response.result.access_token);
    }

    // --- jwt: OTP connect(origin, alias, code) ---
    this.assertJwtAuth();

    if (!arg1 || typeof arg1 !== 'string' || !arg2 || !arg3) {
      throw new Error('connect(origin, alias, code) is required for JWT auth');
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
    const session = this.httpClient.fork();
    session.setJwtToken(response.result.access_token);
    session.setOrigin(origin);
    session.setUrn(urn);

    return this.buildClients(session, response.result.access_token);
  }

  /**
   * Self-service origin configuration, authenticated purely by the origin's
   * own key — no connected session required. Sibling to `connect()`/
   * `register()`, but for configuring the origin itself rather than one of
   * its identities.
   */
  get origin() {
    return {
      /**
       * Patch this origin's own presentation metadata (`company`,
       * `tosGateShowHome`, `gateAccentColor`,
       * `verificationGateReturnUrlAllowlist`). `originName`/`apiKey` default
       * to this SDK instance's own config, so with `apiKey`/`originKey` auth
       * you typically only pass `metadata`:
       *
       * ```typescript
       * await bloque.origin.metadata({
       *   metadata: { gateAccentColor: '#1a73e8' },
       * });
       * ```
       *
       * This is a one-time/deploy-script call, not something you run
       * per-request or per-user.
       */
      metadata: (
        options: UpdateOriginMetadataOptions,
      ): Promise<UpdateOriginMetadataResult> =>
        this.updateOriginMetadata(options),
    };
  }

  private async updateOriginMetadata(
    options: UpdateOriginMetadataOptions,
  ): Promise<UpdateOriginMetadataResult> {
    const originName = options.originName ?? this.httpClient.origin;
    if (!originName) {
      throw new Error(
        'origin.metadata() requires originName (or configure the SDK with an origin)',
      );
    }

    const apiKey = options.apiKey ?? this.resolveOwnApiKey();
    if (!apiKey) {
      throw new Error(
        'origin.metadata() requires apiKey (or configure the SDK with apiKey/originKey auth)',
      );
    }

    return this.identity.origins.updateMetadata({
      originName,
      apiKey,
      metadata: options.metadata,
    });
  }

  private resolveOwnApiKey(): string | undefined {
    const { auth } = this.httpClient;
    if (auth.type === 'apiKey') return auth.apiKey;
    if (auth.type === 'originKey') return auth.originKey;
    return undefined;
  }
}
