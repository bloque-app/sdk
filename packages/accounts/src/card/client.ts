import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountStatus,
  CardDetails,
  CreateAccountRequest,
  CreateAccountResponse,
  CreateCardAccountInput,
  GetBalanceResponse,
  ListAccountsResponse,
  ListMovementsResponse,
  TokenBalance,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../api-types';
import type {
  CardAccount,
  CardMovement,
  CreateCardParams,
  GetBalanceParams,
  ListCardParams,
  ListMovementsParams,
  UpdateCardMetadataParams,
} from './types';

export class CardClient extends BaseClient {
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
      ledger_account_id: params.ledgerId,
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

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * List card accounts for a holder
   *
   * @param params - List parameters
   * @returns Promise resolving to array of card accounts with balances
   *
   * @example
   * ```typescript
   * const cards = await bloque.accounts.card.list({
   *   holderUrn: 'did:bloque:bloque-whatsapp:573023348486',
   * });
   * ```
   */
  async list(params?: ListCardParams): Promise<CardAccount[]> {
    const queryParams = new URLSearchParams({
      holder_urn: params?.holderUrn || this.httpClient.config.urn || '',
      medium: 'card',
    });

    const response = await this.httpClient.request<
      ListAccountsResponse<CardDetails>
    >({
      method: 'GET',
      path: `/api/accounts?${queryParams.toString()}`,
    });

    return response.accounts.map((account) => ({
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
      balance: account.balance,
    }));
  }

  /**
   * List card account movements/transactions
   *
   * @param params - Movement list parameters
   * @returns Promise resolving to array of card movements
   *
   * @example
   * ```typescript
   * // Basic usage
   * const movements = await bloque.accounts.card.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   * });
   *
   * // With pagination and filters
   * const recentMovements = await bloque.accounts.card.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   *   limit: 50,
   *   direction: 'in',
   *   after: '2025-01-01T00:00:00Z',
   * });
   * ```
   */
  async movements(params: ListMovementsParams): Promise<CardMovement[]> {
    const queryParams = new URLSearchParams();

    const asset = params.asset || 'DUSD/6';
    if (asset !== 'DUSD/6' && asset !== 'KSM/12') {
      throw new Error('Invalid asset type. Supported assets are USD and KSM.');
    }

    queryParams.set('asset', asset);

    if (params.limit !== undefined) {
      queryParams.set('limit', params.limit.toString());
    }

    if (params.before) {
      queryParams.set('before', params.before);
    }

    if (params.after) {
      queryParams.set('after', params.after);
    }

    if (params.reference) {
      queryParams.set('reference', params.reference);
    }

    if (params.direction) {
      queryParams.set('direction', params.direction);
    }

    const queryString = queryParams.toString();
    const path = `/api/accounts/${params.urn}/movements${queryString ? `?${queryString}` : ''}`;

    const response = await this.httpClient.request<ListMovementsResponse>({
      method: 'GET',
      path,
    });

    return response.transactions;
  }

  /**
   * Get card account balance
   *
   * @param params - Balance query parameters
   * @returns Promise resolving to token balances
   *
   * @example
   * ```typescript
   * const balances = await bloque.accounts.card.balance({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   * });
   * ```
   */
  async balance(
    params: GetBalanceParams,
  ): Promise<Record<string, TokenBalance>> {
    const response = await this.httpClient.request<GetBalanceResponse>({
      method: 'GET',
      path: `/api/accounts/${params.urn}/balance`,
    });

    return response.balance;
  }

  /**
   * Update card account metadata
   *
   * @param params - Metadata update parameters
   * @returns Promise resolving to the updated card account
   *
   * @example
   * ```typescript
   * const card = await bloque.accounts.card.updateMetadata({
   *   urn: 'did:bloque:mediums:card:account:123',
   *   metadata: {
   *     updated_by: 'admin',
   *     update_reason: 'customer_request'
   *   }
   * });
   * ```
   */
  async updateMetadata(params: UpdateCardMetadataParams): Promise<CardAccount> {
    const request: UpdateAccountRequest = {
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<CardDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${params.urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Update card account name
   *
   * @param urn - Card account URN
   * @param name - New name for the card
   * @returns Promise resolving to the updated card account
   *
   * @example
   * ```typescript
   * const card = await bloque.accounts.card.updateName(
   *   'did:bloque:mediums:card:account:123',
   *   'My Business Card'
   * );
   * ```
   */
  async updateName(urn: string, name: string): Promise<CardAccount> {
    const request: UpdateAccountRequest = {
      metadata: {
        name,
      },
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<CardDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Activate a card account
   *
   * @param urn - Card account URN
   * @returns Promise resolving to the updated card account
   *
   * @example
   * ```typescript
   * const card = await bloque.accounts.card.activate(
   *   'did:bloque:mediums:card:account:123'
   * );
   * ```
   */
  async activate(urn: string): Promise<CardAccount> {
    return this._updateStatus(urn, 'active');
  }

  /**
   * Freeze a card account
   *
   * @param urn - Card account URN
   * @returns Promise resolving to the updated card account
   *
   * @example
   * ```typescript
   * const card = await bloque.accounts.card.freeze(
   *   'did:bloque:mediums:card:account:123'
   * );
   * ```
   */
  async freeze(urn: string): Promise<CardAccount> {
    return this._updateStatus(urn, 'frozen');
  }

  /**
   * Disable a card account
   *
   * @param urn - Card account URN
   * @returns Promise resolving to the updated card account
   *
   * @example
   * ```typescript
   * const card = await bloque.accounts.card.disable(
   *   'did:bloque:mediums:card:account:123'
   * );
   * ```
   */
  async disable(urn: string): Promise<CardAccount> {
    return this._updateStatus(urn, 'disabled');
  }

  /**
   * Private method to update card status
   */
  private async _updateStatus(
    urn: string,
    status: AccountStatus,
  ): Promise<CardAccount> {
    const request: UpdateAccountRequest = {
      status,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<CardDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Private method to map API response to CardAccount
   */
  private _mapAccountResponse(
    account: UpdateAccountResponse<CardDetails>['result']['account'],
  ): CardAccount {
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
