import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountStatus,
  BancolombiaDetails,
  CreateAccountRequest,
  CreateAccountResponse,
  ListAccountsResponse,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  BancolombiaAccount,
  CreateBancolombiaAccountParams,
  ListBancolombiaAccountsParams,
  ListBancolombiaAccountsResult,
  UpdateBancolombiaMetadataParams,
} from './types';

export class BancolombiaClient extends BaseClient {
  /**
   * List Bancolombia accounts
   *
   * Retrieves a list of Bancolombia accounts, optionally filtered by holder URN or specific account URN.
   *
   * @param params - List parameters (optional)
   * @returns Promise resolving to list of Bancolombia accounts
   *
   * @example
   * ```typescript
   * // List all Bancolombia accounts for the authenticated holder
   * const result = await bloque.accounts.bancolombia.list();
   *
   * // List Bancolombia accounts for a specific holder
   * const result = await bloque.accounts.bancolombia.list({
   *   holderUrn: 'did:bloque:bloque-root:nestor'
   * });
   *
   * // Get a specific Bancolombia account
   * const result = await bloque.accounts.bancolombia.list({
   *   urn: 'did:bloque:account:bancolombia:abc-123'
   * });
   * ```
   */
  async list(
    params?: ListBancolombiaAccountsParams,
  ): Promise<ListBancolombiaAccountsResult> {
    const holderUrn = params?.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    queryParams.append('medium', 'bancolombia');

    if (holderUrn) {
      queryParams.append('holder_urn', holderUrn);
    }

    if (params?.urn) {
      queryParams.append('urn', params.urn);
    }

    const path = `/api/accounts?${queryParams.toString()}`;

    const response = await this.httpClient.request<
      ListAccountsResponse<BancolombiaDetails>
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
   * Create a new Bancolombia account
   *
   * @param params - Bancolombia account creation parameters
   * @param options - Creation options (optional)
   * @returns Promise resolving to the created Bancolombia account
   *
   * @example
   * ```typescript
   * // Create without waiting
   * const account = await bloque.accounts.bancolombia.create({
   *   name: 'Main Account'
   * });
   *
   * // Create and wait for active status
   * const account = await bloque.accounts.bancolombia.create({
   *   name: 'Main Account'
   * }, { waitLedger: true });
   * ```
   */
  async create(
    params: CreateBancolombiaAccountParams = {},
    options?: CreateAccountOptions,
  ): Promise<BancolombiaAccount> {
    const request: CreateAccountRequest = {
      holder_urn: params?.holderUrn || this.httpClient.urn || '',
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
  ): Promise<BancolombiaAccount> {
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
