import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountStatus,
  CreateAccountRequest,
  CreateAccountResponse,
  CreatePolygonAccountInput,
  PolygonDetails,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../internal/wire-types';
import type {
  CreatePolygonAccountParams,
  PolygonAccount,
  UpdatePolygonMetadataParams,
} from './types';

export class PolygonClient extends BaseClient {
  /**
   * Create a new polygon account
   *
   * Polygon accounts are cryptocurrency wallets on the Polygon network.
   * They're created automatically without requiring additional input.
   *
   * @param params - Polygon account creation parameters
   * @returns Promise resolving to the created polygon account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.polygon.create();
   * ```
   */
  async create(
    params: CreatePolygonAccountParams = {},
  ): Promise<PolygonAccount> {
    const input: CreatePolygonAccountInput = {};

    const request: CreateAccountRequest<CreatePolygonAccountInput> = {
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
      CreateAccountResponse<PolygonDetails>,
      CreateAccountRequest<CreatePolygonAccountInput>
    >({
      method: 'POST',
      path: '/api/mediums/polygon',
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Update polygon account metadata
   *
   * @param params - Metadata update parameters
   * @returns Promise resolving to the updated polygon account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.polygon.updateMetadata({
   *   urn: 'did:bloque:account:polygon:0x05B10c9B6241b73fc8c906fB7979eFc7764AB731',
   *   metadata: {
   *     updated_by: 'admin',
   *     update_reason: 'testing_update'
   *   }
   * });
   * ```
   */
  async updateMetadata(
    params: UpdatePolygonMetadataParams,
  ): Promise<PolygonAccount> {
    const request: UpdateAccountRequest = {
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<PolygonDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${params.urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Activate a polygon account
   *
   * @param urn - Polygon account URN
   * @returns Promise resolving to the updated polygon account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.polygon.activate(
   *   'did:bloque:account:polygon:0x05B10c9B6241b73fc8c906fB7979eFc7764AB731'
   * );
   * ```
   */
  async activate(urn: string): Promise<PolygonAccount> {
    return this._updateStatus(urn, 'active');
  }

  /**
   * Freeze a polygon account
   *
   * @param urn - Polygon account URN
   * @returns Promise resolving to the updated polygon account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.polygon.freeze(
   *   'did:bloque:account:polygon:0x05B10c9B6241b73fc8c906fB7979eFc7764AB731'
   * );
   * ```
   */
  async freeze(urn: string): Promise<PolygonAccount> {
    return this._updateStatus(urn, 'frozen');
  }

  /**
   * Disable a polygon account
   *
   * @param urn - Polygon account URN
   * @returns Promise resolving to the updated polygon account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.polygon.disable(
   *   'did:bloque:account:polygon:0x05B10c9B6241b73fc8c906fB7979eFc7764AB731'
   * );
   * ```
   */
  async disable(urn: string): Promise<PolygonAccount> {
    return this._updateStatus(urn, 'disabled');
  }

  /**
   * Private method to update polygon account status
   */
  private async _updateStatus(
    urn: string,
    status: AccountStatus,
  ): Promise<PolygonAccount> {
    const request: UpdateAccountRequest = {
      status,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<PolygonDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Private method to map API response to PolygonAccount
   */
  private _mapAccountResponse(
    account: UpdateAccountResponse<PolygonDetails>['result']['account'],
  ): PolygonAccount {
    return {
      urn: account.urn,
      id: account.id,
      address: account.details.address,
      network: account.details.network,
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
