import { BaseClient } from '@bloque/sdk-core';
import type {
  ApiKeyInfo,
  CreateApiKeyParams,
  CreateApiKeyResult,
  ExchangeApiKeyParams,
  ExchangeApiKeyResult,
  RotateApiKeyResult,
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
   * This endpoint is unauthenticated and rate-limited.
   * The returned JWT is valid for `expiresIn` seconds (default 900 = 15 min).
   */
  async exchange(params: ExchangeApiKeyParams): Promise<ExchangeApiKeyResult> {
    const response = await this.httpClient.request<ExchangeApiKeyResponse>({
      method: 'POST',
      path: '/api/api-keys/exchange',
      body: { key: params.key, scopes: params.scopes },
    });

    return {
      accessToken: response.access_token,
      expiresIn: response.expires_in,
      tokenType: response.token_type,
    };
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
}
