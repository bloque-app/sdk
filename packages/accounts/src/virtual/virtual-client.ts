import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountStatus,
  CreateAccountRequest,
  CreateAccountResponse,
  CreateVirtualAccountInput,
  ListAccountsResponse,
  UpdateAccountRequest,
  UpdateAccountResponse,
  VirtualDetails,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  CreateVirtualAccountParams,
  ListVirtualAccountsParams,
  ListVirtualAccountsResult,
  UpdateVirtualMetadataParams,
  VirtualAccount,
} from './types';

export class VirtualClient extends BaseClient {
  /**
   * List virtual accounts
   *
   * Retrieves a list of virtual accounts, optionally filtered by holder URN or specific account URN.
   *
   * @param params - List parameters (optional)
   * @returns Promise resolving to list of virtual accounts
   *
   * @example
   * ```typescript
   * // List all virtual accounts for the authenticated holder
   * const result = await bloque.accounts.virtual.list();
   *
   * // List virtual accounts for a specific holder
   * const result = await bloque.accounts.virtual.list({
   *   holderUrn: 'did:bloque:bloque-root:nestor'
   * });
   *
   * // Get a specific virtual account
   * const result = await bloque.accounts.virtual.list({
   *   urn: 'did:bloque:account:virtual:275d10a2-0854-4081-9d61-ea506e917335'
   * });
   * ```
   */
  async list(
    params?: ListVirtualAccountsParams,
  ): Promise<ListVirtualAccountsResult> {
    const holderUrn = params?.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    queryParams.append('medium', 'virtual');

    if (holderUrn) {
      queryParams.append('holder_urn', holderUrn);
    }

    if (params?.urn) {
      queryParams.append('urn', params.urn);
    }

    const path = `/api/accounts?${queryParams.toString()}`;

    const response = await this.httpClient.request<
      ListAccountsResponse<VirtualDetails>
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
   * Create a new virtual account
   *
   * Virtual accounts are simple testing accounts requiring only basic personal information.
   * They're useful for development and testing purposes.
   *
   * @param params - Virtual account creation parameters
   * @param options - Creation options (optional)
   * @returns Promise resolving to the created virtual account
   *
   * @example
   * ```typescript
   * // Create without waiting
   * const account = await bloque.accounts.virtual.create({
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
   *
   * // Create and wait for active status
   * const account = await bloque.accounts.virtual.create({
   *   firstName: 'John',
   *   lastName: 'Doe'
   * }, { waitLedger: true });
   * ```
   */
  async create(
    params: CreateVirtualAccountParams,
    options?: CreateAccountOptions,
  ): Promise<VirtualAccount> {
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
  ): Promise<VirtualAccount> {
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
      console.log(account);

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
