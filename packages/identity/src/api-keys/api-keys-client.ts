import { BaseClient } from '@bloque/sdk-core';
import type {
  ApiKeyInfo,
  CreateApiKeyParams,
  CreateApiKeyResult,
  ExchangeApiKeyParams,
  ExchangeApiKeyResult,
  RotateApiKeyResult,
  UpsertOriginWebhookSecretParams,
  UpsertOriginWebhookSecretResult,
} from './types';

interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  domains: string[];
  expiration: string;
  metadata?: Record<string, unknown>;
}

interface CreateApiKeyResponse {
  key_id: string;
  secret_key: string;
  publishable_key: string;
}

interface ApiKeyWire {
  id: string;
  key_id: string;
  publishable_key: string;
  name: string;
  scopes: string[];
  domains: string[];
  status: string;
  expiration: string;
  metadata: Record<string, unknown>;
  last_used_at?: string | null;
  created_at: string;
}

interface ExchangeApiKeyResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface RotateApiKeyResponse {
  secret_key: string;
}

interface UpsertOriginWebhookSecretRequest {
  api_key: string;
  webhook_secret: string;
}

interface UpsertOriginWebhookSecretResponse {
  origin_name: string;
  key: string;
  updated: true;
}

function mapApiKeyWire(wire: ApiKeyWire): ApiKeyInfo {
  return {
    id: wire.id,
    keyId: wire.key_id,
    publishableKey: wire.publishable_key,
    name: wire.name,
    scopes: wire.scopes,
    domains: wire.domains,
    status: wire.status as ApiKeyInfo['status'],
    expiration: wire.expiration,
    metadata: wire.metadata,
    lastUsedAt: wire.last_used_at,
    createdAt: wire.created_at,
  };
}

export class ApiKeysClient extends BaseClient {
  /**
   * Create a new API key.
   *
   * The response includes the secret key, which is shown only once.
   * Store it securely -- it cannot be retrieved later.
   *
   * When the current session is `kind: origin-operator` (after
   * `orgs.assumeOrigin()` or a bound-key discovery exchange), the minted
   * key is origin-bound (`bound_origin` set, owner = controller org).
   * User JWTs cannot mint bound keys.
   */
  async create(params: CreateApiKeyParams): Promise<CreateApiKeyResult> {
    const request: CreateApiKeyRequest = {
      name: params.name,
      scopes: params.scopes,
      domains: params.domains,
      expiration: params.expiration,
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<CreateApiKeyResponse>({
      method: 'POST',
      path: '/api/api-keys',
      body: request,
    });

    return {
      keyId: response.key_id,
      secretKey: response.secret_key,
      publishableKey: response.publishable_key,
    };
  }

  /** List all API keys for the authenticated identity. */
  async list(): Promise<ApiKeyInfo[]> {
    const response = await this.httpClient.request<ApiKeyWire[]>({
      method: 'GET',
      path: '/api/api-keys',
    });

    return response.map(mapApiKeyWire);
  }

  /** Get a single API key by ID. */
  async get(id: string): Promise<ApiKeyInfo> {
    const response = await this.httpClient.request<ApiKeyWire>({
      method: 'GET',
      path: `/api/api-keys/${id}`,
    });

    return mapApiKeyWire(response);
  }

  /**
   * Exchange an API secret key for a short-lived JWT.
   *
   * Unbound keys need no Authorization — this endpoint is public and
   * rate-limited. Origin-bound keys:
   * - `{ key }` → origin-operator JWT (discovery)
   * - `{ key, asIdentity }` → owner-read impersonation JWT. Requires the
   *   current session to already hold a `kind: origin-operator` token
   *   (from `orgs.assumeOrigin()` or a previous bound-key discovery
   *   exchange); that Bearer is forwarded. Cross-origin URNs are 404.
   *
   * The returned JWT is valid for `expiresIn` seconds (default 900 = 15 min).
   */
  async exchange(params: ExchangeApiKeyParams): Promise<ExchangeApiKeyResult> {
    const body: {
      key: string;
      scopes?: string[];
      as_identity?: string;
    } = { key: params.key };

    if (params.scopes) {
      body.scopes = params.scopes;
    }
    if (params.asIdentity) {
      body.as_identity = params.asIdentity;
    }

    const operatorToken = params.asIdentity
      ? this.resolveOperatorBearer()
      : undefined;

    const response = await this.httpClient.request<ExchangeApiKeyResponse>({
      method: 'POST',
      path: '/api/api-keys/exchange',
      body,
      authorizationOverride: operatorToken
        ? `Bearer ${operatorToken}`
        : undefined,
    });

    return {
      accessToken: response.access_token,
      expiresIn: response.expires_in,
      tokenType: response.token_type,
    };
  }

  /**
   * Bearer used for `as_identity` impersonation. `/api/api-keys/exchange`
   * is a public route, so the HTTP client would otherwise strip auth —
   * we forward the current origin-operator JWT explicitly.
   */
  private resolveOperatorBearer(): string | undefined {
    if (this.httpClient.accessToken) {
      return this.httpClient.accessToken;
    }
    if (this.httpClient.auth.type === 'jwt') {
      return this.httpClient.getJwtToken() ?? undefined;
    }
    return undefined;
  }

  /** Revoke an API key. */
  async revoke(id: string): Promise<void> {
    await this.httpClient.request<void>({
      method: 'DELETE',
      path: `/api/api-keys/${id}`,
    });
  }

  /** Rotate an API key secret. Returns the new secret key (shown only once). */
  async rotate(id: string): Promise<RotateApiKeyResult> {
    const response = await this.httpClient.request<RotateApiKeyResponse>({
      method: 'POST',
      path: `/api/api-keys/${id}/rotate`,
    });

    return { secretKey: response.secret_key };
  }

  /**
   * Create or update the webhook secret for an API-key-provider origin.
   * Authenticates purely via the origin's own `apiKey` — no session/JWT
   * involved, so your server can call this without a logged-in user.
   *
   * @param originName - The namespace of the api-key-provider origin.
   */
  async upsertOriginWebhookSecret(
    originName: string,
    params: UpsertOriginWebhookSecretParams,
  ): Promise<UpsertOriginWebhookSecretResult> {
    const response = await this.httpClient.request<
      UpsertOriginWebhookSecretResponse,
      UpsertOriginWebhookSecretRequest
    >({
      method: 'PUT',
      path: `/api/api-keys/origins/${originName}/webhook-secret`,
      body: {
        api_key: params.apiKey,
        webhook_secret: params.webhookSecret,
      },
    });

    return {
      originName: response.origin_name,
      key: response.key,
      updated: response.updated,
    };
  }
}
