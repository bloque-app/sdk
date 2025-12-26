import type { HttpClient } from '@bloque/sdk-core';
import type {
  AccountStatus,
  BancolombiaDetails,
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../api-types';
import type {
  BancolombiaAccount,
  CreateBancolombiaAccountParams,
  UpdateBancolombiaMetadataParams,
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
      ledger_account_id: params.ledgerId,
      input: {},
      metadata: {
        source: 'sdk-typescript',
        name: params.name,
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

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Update Bancolombia account metadata
   *
   * @param params - Metadata update parameters
   * @returns Promise resolving to the updated Bancolombia account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.bancolombia.updateMetadata({
   *   urn: 'did:bloque:mediums:bancolombia:account:123',
   *   metadata: {
   *     updated_by: 'admin',
   *     update_reason: 'customer_request'
   *   }
   * });
   * ```
   */
  async updateMetadata(
    params: UpdateBancolombiaMetadataParams,
  ): Promise<BancolombiaAccount> {
    const request: UpdateAccountRequest = {
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<BancolombiaDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${params.urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Update Bancolombia account name
   *
   * @param urn - Bancolombia account URN
   * @param name - New name for the account
   * @returns Promise resolving to the updated Bancolombia account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.bancolombia.updateName(
   *   'did:bloque:mediums:bancolombia:account:123',
   *   'Main Business Account'
   * );
   * ```
   */
  async updateName(urn: string, name: string): Promise<BancolombiaAccount> {
    const request: UpdateAccountRequest = {
      metadata: {
        name,
      },
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<BancolombiaDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Activate a Bancolombia account
   *
   * @param urn - Bancolombia account URN
   * @returns Promise resolving to the updated Bancolombia account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.bancolombia.activate(
   *   'did:bloque:mediums:bancolombia:account:123'
   * );
   * ```
   */
  async activate(urn: string): Promise<BancolombiaAccount> {
    return this._updateStatus(urn, 'active');
  }

  /**
   * Freeze a Bancolombia account
   *
   * @param urn - Bancolombia account URN
   * @returns Promise resolving to the updated Bancolombia account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.bancolombia.freeze(
   *   'did:bloque:mediums:bancolombia:account:123'
   * );
   * ```
   */
  async freeze(urn: string): Promise<BancolombiaAccount> {
    return this._updateStatus(urn, 'frozen');
  }

  /**
   * Disable a Bancolombia account
   *
   * @param urn - Bancolombia account URN
   * @returns Promise resolving to the updated Bancolombia account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.bancolombia.disable(
   *   'did:bloque:mediums:bancolombia:account:123'
   * );
   * ```
   */
  async disable(urn: string): Promise<BancolombiaAccount> {
    return this._updateStatus(urn, 'disabled');
  }

  /**
   * Private method to update Bancolombia account status
   */
  private async _updateStatus(
    urn: string,
    status: AccountStatus,
  ): Promise<BancolombiaAccount> {
    const request: UpdateAccountRequest = {
      status,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<BancolombiaDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Private method to map API response to BancolombiaAccount
   */
  private _mapAccountResponse(
    account: UpdateAccountResponse<BancolombiaDetails>['result']['account'],
  ): BancolombiaAccount {
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
