import type { HttpClient } from '@bloque/sdk-core';
import type {
  BancolombiaDetails,
  CreateAccountRequest,
  CreateAccountResponse,
} from '../api-types';
import type {
  BancolombiaAccount,
  CreateBancolombiaAccountParams,
} from './types';

export class BancolombiaClient {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Create a new Bancolombia account
   *
   * @param params - Bancolombia account creation parameters
   * @returns Promise resolving to the created Bancolombia account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.bancolombia.create({
   *   urn: 'did:bloque:user:123',
   *   name: 'Main Account'
   * });
   * ```
   */
  async create(
    params: CreateBancolombiaAccountParams,
  ): Promise<BancolombiaAccount> {
    const request: CreateAccountRequest = {
      holder_urn: params.urn,
      webhook_url: params.webhookUrl,
      input: {},
      metadata: {
        source: 'sdk-typescript',
        name: params.name,
        card_urn: params.cardUrn,
        ...params.metadata,
      },
    };

    const response = await this.httpClient.request<
      CreateAccountResponse<BancolombiaDetails>,
      CreateAccountRequest
    >({
      method: 'POST',
      path: '/api/mediums/bancolombia',
      body: request,
    });

    const account = response.result.account;

    return {
      urn: account.urn,
      id: account.id,
      referenceCode: account.details.reference_code,
      status: account.status,
      ownerUrn: account.owner_urn,
      ledgerId: account.ledger_account_id,
      webhookUrl: account.webhook_url,
      metadata: account.metadata,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };
  }
}
