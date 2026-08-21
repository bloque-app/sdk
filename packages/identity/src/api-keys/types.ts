export type {
  ExchangeApiKeyParams,
  ExchangeApiKeyResult,
} from '@bloque/sdk-core';

export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export interface CreateApiKeyParams {
  name: string;
  scopes: string[];
  domains: string[];
  /** 'never' or seconds as string */
  expiration: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of creating an API key.
 * The secret key is shown only once -- store it securely.
 */
export interface CreateApiKeyResult {
  keyId: string;
  secretKey: string;
  publishableKey: string;
}

export interface ApiKeyInfo {
  id: string;
  keyId: string;
  publishableKey: string;
  name: string;
  scopes: string[];
  domains: string[];
  status: ApiKeyStatus;
  expiration: string;
  metadata: Record<string, unknown>;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface RotateApiKeyResult {
  secretKey: string;
}

export interface UpsertOriginWebhookSecretParams {
  /** The origin's own API key — authenticates this call, no session/JWT needed. */
  apiKey: string;
  webhookSecret: string;
}

export interface UpsertOriginWebhookSecretResult {
  originName: string;
  key: string;
  updated: true;
}
