import type { HttpClient } from '@bloque/sdk-core';
import type {
  CardDetails,
  CreateAccountRequest,
  CreateAccountResponse,
  CreateCardAccountInput,
} from '../api-types';
import type { CardAccount, CreateCardParams } from './types';

export class CardClient {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Create a new card account
   *
   * @param params - Card creation parameters
   * @returns Promise resolving to the created card account
   *
   * @example
   * ```typescript
   * const card = await bloque.accounts.card.create({
   *   urn: 'did:bloque:user:123',
   *   name: 'My Card',
   * });
   * ```
   */
  async create(params: CreateCardParams): Promise<CardAccount> {
    const request: CreateAccountRequest<CreateCardAccountInput> = {
      holder_urn: params.urn,
      webhook_url: params.webhookUrl,
      input: {
        create: {
          card_type: 'VIRTUAL',
        },
      },
      metadata: {
        source: 'sdk-typescript',
        name: params.name,
        ...params.metadata,
      },
    };

    const response = await this.httpClient.request<
      CreateAccountResponse<CardDetails>,
      CreateAccountRequest<CreateCardAccountInput>
    >({
      method: 'POST',
      path: '/api/mediums/card',
      body: request,
    });

    const account = response.result.account;

    return {
      urn: account.urn,
      id: account.id,
      lastFour: account.details.card_last_four,
      productType: account.details.card_product_type,
      status: account.status,
      cardType: account.details.card_type,
      detailsUrl: account.details.card_url_details,
      ownerUrn: account.owner_urn,
      ledgerId: account.ledger_account_id,
      webhookUrl: account.webhook_url,
      metadata: account.metadata,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };
  }
}
