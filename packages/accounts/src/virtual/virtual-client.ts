import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountStatus,
  CreateAccountRequest,
  CreateAccountResponse,
  CreateVirtualAccountInput,
  UpdateAccountRequest,
  UpdateAccountResponse,
  VirtualDetails,
} from '../internal/wire-types';
import type {
  CreateVirtualAccountParams,
  UpdateVirtualMetadataParams,
  VirtualAccount,
} from './types';

export class VirtualClient extends BaseClient {
  /**
   * Create a new virtual account
   *
   * Virtual accounts are simple testing accounts requiring only basic personal information.
   * They're useful for development and testing purposes.
   *
   * @param params - Virtual account creation parameters
   * @returns Promise resolving to the created virtual account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.virtual.create({
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
   * ```
   */
  async create(params: CreateVirtualAccountParams): Promise<VirtualAccount> {
    const input: CreateVirtualAccountInput = {
      first_name: params.firstName,
      last_name: params.lastName,
    };

    const request: CreateAccountRequest<CreateVirtualAccountInput> = {
      holder_urn: params.holderUrn || this.httpClient.urn || '',
      webhook_url: params.webhookUrl,
      ledger_account_id: params.ledgerId,
      input,
      metadata: {
        source: 'sdk-typescript',
        ...params.metadata,
      },
    };

    const response = await this.httpClient.request<
      CreateAccountResponse<VirtualDetails>,
      CreateAccountRequest<CreateVirtualAccountInput>
    >({
      method: 'POST',
      path: '/api/mediums/virtual',
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Update virtual account metadata
   *
   * @param params - Metadata update parameters
   * @returns Promise resolving to the updated virtual account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.virtual.updateMetadata({
   *   urn: 'did:bloque:mediums:virtual:account:123',
   *   metadata: {
   *     updated_by: 'admin',
   *     update_reason: 'testing_update'
   *   }
   * });
   * ```
   */
  async updateMetadata(
    params: UpdateVirtualMetadataParams,
  ): Promise<VirtualAccount> {
    const request: UpdateAccountRequest = {
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<VirtualDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${params.urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Activate a virtual account
   *
   * @param urn - Virtual account URN
   * @returns Promise resolving to the updated virtual account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.virtual.activate(
   *   'did:bloque:mediums:virtual:account:123'
   * );
   * ```
   */
  async activate(urn: string): Promise<VirtualAccount> {
    return this._updateStatus(urn, 'active');
  }

  /**
   * Freeze a virtual account
   *
   * @param urn - Virtual account URN
   * @returns Promise resolving to the updated virtual account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.virtual.freeze(
   *   'did:bloque:mediums:virtual:account:123'
   * );
   * ```
   */
  async freeze(urn: string): Promise<VirtualAccount> {
    return this._updateStatus(urn, 'frozen');
  }

  /**
   * Disable a virtual account
   *
   * @param urn - Virtual account URN
   * @returns Promise resolving to the updated virtual account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.virtual.disable(
   *   'did:bloque:mediums:virtual:account:123'
   * );
   * ```
   */
  async disable(urn: string): Promise<VirtualAccount> {
    return this._updateStatus(urn, 'disabled');
  }

  /**
   * Private method to update virtual account status
   */
  private async _updateStatus(
    urn: string,
    status: AccountStatus,
  ): Promise<VirtualAccount> {
    const request: UpdateAccountRequest = {
      status,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<VirtualDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Private method to map API response to VirtualAccount
   */
  private _mapAccountResponse(
    account: UpdateAccountResponse<VirtualDetails>['result']['account'],
  ): VirtualAccount {
    return {
      urn: account.urn,
      id: account.id,
      firstName: account.details.first_name,
      lastName: account.details.last_name,
      status: account.status,
      ownerUrn: account.owner_urn,
      ledgerId: account.ledger_account_id,
      webhookUrl: account.webhook_url,
      metadata: account.metadata as Record<string, string> | undefined,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };
  }
}
