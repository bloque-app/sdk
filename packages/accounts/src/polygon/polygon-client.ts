import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountStatus,
  CreateAccountRequest,
  CreateAccountResponse,
  CreatePolygonAccountInput,
  ListAccountsResponse,
  PolygonDetails,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  CreatePolygonAccountParams,
  ListPolygonAccountsParams,
  ListPolygonAccountsResult,
  PolygonAccount,
  UpdatePolygonMetadataParams,
} from './types';

export class PolygonClient extends BaseClient {
  /**
   * List polygon accounts
   *
   * Retrieves a list of polygon accounts, optionally filtered by holder URN or specific account URN.
   *
   * @param params - List parameters (optional)
   * @returns Promise resolving to list of polygon accounts
   *
   * @example
   * ```typescript
   * // List all polygon accounts for the authenticated holder
   * const result = await bloque.accounts.polygon.list();
   *
   * // List polygon accounts for a specific holder
   * const result = await bloque.accounts.polygon.list({
   *   holderUrn: 'did:bloque:bloque-root:nestor'
   * });
   *
   * // Get a specific polygon account
   * const result = await bloque.accounts.polygon.list({
   *   urn: 'did:bloque:account:polygon:0x05B10c9B6241b73fc8c906fB7979eFc7764AB731'
   * });
   * ```
   */
  async list(
    params?: ListPolygonAccountsParams,
  ): Promise<ListPolygonAccountsResult> {
    const holderUrn = params?.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    queryParams.append('medium', 'polygon');

    if (holderUrn) {
      queryParams.append('holder_urn', holderUrn);
    }

    if (params?.urn) {
      queryParams.append('urn', params.urn);
    }

    const path = `/api/accounts?${queryParams.toString()}`;

    const response = await this.httpClient.request<
      ListAccountsResponse<PolygonDetails>
    >({
      method: 'GET',
      path,
    });

    return {
      accounts: response.accounts.map((account) => ({
        ...this._mapAccountResponse(account),
        balance: account.balance,
      })),
    };
  }

  /**
   * Create a new polygon account
   *
   * Polygon accounts are cryptocurrency wallets on the Polygon network.
   * They're created automatically without requiring additional input.
   *
   * @param params - Polygon account creation parameters
   * @param options - Creation options (optional)
   * @returns Promise resolving to the created polygon account
   *
   * @example
   * ```typescript
   * // Create without waiting
   * const account = await bloque.accounts.polygon.create();
   *
   * // Create and wait for active status
   * const account = await bloque.accounts.polygon.create({}, { waitLedger: true });
   * ```
   */
  async create(
    params: CreatePolygonAccountParams = {},
    options?: CreateAccountOptions,
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

    const account = this._mapAccountResponse(response.result.account);

    if (options?.waitLedger) {
      return this._waitForActiveStatus(account.urn, options.timeout || 60000);
    }

    return account;
  }

  /**
   * Private method to poll account status until it becomes active
   */
  private async _waitForActiveStatus(
    urn: string,
    timeout: number,
  ): Promise<PolygonAccount> {
    const startTime = Date.now();
    const pollingInterval = 2000; // 2 second

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Timeout waiting for account to become active. URN: ${urn}`,
        );
      }

      const result = await this.list({ urn });
      const account = result.accounts[0];

      if (!account) {
        throw new Error(`Account not found. URN: ${urn}`);
      }

      if (account.status === 'active') {
        return account;
      }

      if (account.status === 'creation_failed') {
        throw new Error(`Account creation failed. URN: ${urn}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    }
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
      balance:
        'balance' in account && account.balance
          ? (account.balance as Record<
              string,
              { current: string; pending: string; in: string; out: string }
            >)
          : undefined,
    };
  }
}
