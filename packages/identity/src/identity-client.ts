import type { HttpClient } from '@bloque/sdk-core';
import { AliasesClient } from './aliases/aliases-client';
import { ApiKeysClient } from './api-keys/api-keys-client';
import { OriginsClient } from './origins/origins-client';
import type { IdentityAlias, IdentityMe, UpdateIdentityParams } from './types';

interface UpdateIdentityResponse {
  result: { identity: IdentityMe };
  req_id: string;
}

export class IdentityClient {
  private readonly httpClient: HttpClient;
  readonly aliases: AliasesClient;
  readonly apiKeys: ApiKeysClient;
  readonly origins: OriginsClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.aliases = new AliasesClient(this.httpClient);
    this.apiKeys = new ApiKeysClient(this.httpClient);
    this.origins = new OriginsClient(this.httpClient);
  }

  /**
   * Get the current authenticated user's identity
   *
   * @returns Current user identity
   */
  async me(): Promise<IdentityMe> {
    return await this.httpClient.request<IdentityMe>({
      method: 'GET',
      path: '/api/identities/me',
    });
  }

  /**
   * Update the current authenticated user's identity
   *
   * Profile and metadata fields are merged with existing values
   * (only the provided fields are updated).
   *
   * @param params - Fields to update
   * @returns Updated identity
   *
   * @example
   * ```typescript
   * const updated = await bloque.identity.updateMe({
   *   profile: { city: 'New York', state: 'NY' },
   *   metadata: { preference: 'dark_mode' },
   * });
   * ```
   */
  async updateMe(params: UpdateIdentityParams): Promise<IdentityMe> {
    const response = await this.httpClient.request<UpdateIdentityResponse>({
      method: 'PATCH',
      path: '/api/identities/me',
      body: params,
    });

    return response.result.identity;
  }

  /**
   * Get the current user's aliases
   *
   * @returns Array of aliases
   */
  async myAliases(): Promise<IdentityAlias[]> {
    return await this.httpClient.request<IdentityAlias[]>({
      method: 'GET',
      path: '/api/identities/me/aliases',
    });
  }

  /**
   * Get an identity by URN
   *
   * @param urn - Identity URN
   * @returns Identity details
   */
  async get(urn: string): Promise<IdentityMe> {
    return await this.httpClient.request<IdentityMe>({
      method: 'GET',
      path: `/api/identities/${urn}`,
    });
  }

  /**
   * Update an identity by URN
   *
   * @param urn - Identity URN
   * @param params - Fields to update
   * @returns Updated identity
   */
  async update(urn: string, params: UpdateIdentityParams): Promise<IdentityMe> {
    const response = await this.httpClient.request<UpdateIdentityResponse>({
      method: 'PATCH',
      path: `/api/identities/${urn}`,
      body: params,
    });

    return response.result.identity;
  }

  /**
   * Get aliases for a specific identity
   *
   * @param urn - Identity URN
   * @returns Array of aliases
   */
  async getAliases(urn: string): Promise<IdentityAlias[]> {
    return await this.httpClient.request<IdentityAlias[]>({
      method: 'GET',
      path: `/api/identities/${urn}/aliases`,
    });
  }
}
