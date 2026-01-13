import { BaseClient } from '@bloque/sdk-core';
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  CreateUsAccountInput,
  ListAccountsResponse,
  TosLinkResponse,
  UpdateAccountRequest,
  UpdateAccountResponse,
  UsDetails,
  UsAccountAddress as WireUsAccountAddress,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  CreateUsAccountParams,
  GetTosLinkParams,
  ListUsAccountsParams,
  ListUsAccountsResult,
  TosLinkResult,
  UpdateUsMetadataParams,
  UsAccount,
} from './types';

export class UsClient extends BaseClient {
  /**
   * Get Terms of Service acceptance link
   *
   * This method generates a URL where users can accept the terms of service
   * required for US account creation. After acceptance, a signed_agreement_id
   * will be provided which is required for account creation.
   *
   * @param params - TOS link parameters
   * @returns Promise resolving to the TOS acceptance URL
   *
   * @example
   * ```typescript
   * const tosLink = await bloque.accounts.us.getTosLink({
   *   redirectUri: 'https://myapp.com/callback'
   * });
   *
   * // Redirect user to tosLink.url
   * // After acceptance, extract signed_agreement_id from callback
   * ```
   */
  async getTosLink(params: GetTosLinkParams): Promise<TosLinkResult> {
    const queryParams = new URLSearchParams({
      redirect_uri: params.redirectUri,
    });

    const response = await this.httpClient.request<TosLinkResponse>({
      method: 'POST',
      path: `/api/mediums/us-account/tos-link?${queryParams.toString()}`,
    });

    return {
      url: response.result.url,
    };
  }

  /**
   * Create a new US bank account
   *
   * Creates a US bank account after the user has accepted the terms of service.
   * You must first call getTosLink to obtain a signed_agreement_id.
   *
   * @param params - US account creation parameters
   * @param options - Creation options (optional)
   * @returns Promise resolving to the created US account
   *
   * @example
   * ```typescript
   * // First, get TOS link and have user accept
   * const tosLink = await bloque.accounts.us.getTosLink({
   *   redirectUri: 'https://myapp.com/callback'
   * });
   *
   * // After user accepts, create account with signed_agreement_id
   * const account = await bloque.accounts.us.create({
   *   type: 'individual',
   *   firstName: 'Robert',
   *   middleName: 'James',
   *   lastName: 'Johnson',
   *   email: 'robert.johnson@example.com',
   *   phone: '+12125551234',
   *   address: {
   *     streetLine1: '456 Wall Street',
   *     streetLine2: 'Suite 789',
   *     city: 'New York',
   *     state: 'NY',
   *     postalCode: '10005',
   *     country: 'US'
   *   },
   *   birthDate: '1985-03-15',
   *   taxIdentificationNumber: '123-45-6789',
   *   govIdCountry: 'US',
   *   govIdImageFront: 'base64_encoded_image',
   *   signedAgreementId: '0d139f8e-14b0-4540-92ba-4e66c619b533'
   * });
   *
   * // Create and wait for active status
   * const account = await bloque.accounts.us.create({
   *   // ... params
   * }, { waitLedger: true });
   * ```
   */
  async create(
    params: CreateUsAccountParams,
    options?: CreateAccountOptions,
  ): Promise<UsAccount> {
    const wireAddress: WireUsAccountAddress = {
      street_line_1: params.address.streetLine1,
      street_line_2: params.address.streetLine2,
      city: params.address.city,
      state: params.address.state,
      postal_code: params.address.postalCode,
      country: params.address.country,
    };

    const input: CreateUsAccountInput = {
      type: params.type,
      first_name: params.firstName,
      middle_name: params.middleName,
      last_name: params.lastName,
      email: params.email,
      phone: params.phone,
      address: wireAddress,
      birth_date: params.birthDate,
      tax_identification_number: params.taxIdentificationNumber,
      gov_id_country: params.govIdCountry,
      gov_id_image_front: params.govIdImageFront,
      signed_agreement_id: params.signedAgreementId,
    };

    const request: CreateAccountRequest<CreateUsAccountInput> = {
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
      CreateAccountResponse<UsDetails>,
      CreateAccountRequest<CreateUsAccountInput>
    >({
      method: 'POST',
      path: '/api/mediums/us-account',
      body: request,
    });

    const account = this._mapAccountResponse(response.result.account);

    if (options?.waitLedger) {
      return this._waitForActiveStatus(account.urn, options.timeout || 60000);
    }

    return account;
  }

  /**
   * List US bank accounts
   *
   * Retrieves a list of US bank accounts, optionally filtered by holder URN or specific account URN.
   *
   * @param params - List parameters (optional)
   * @returns Promise resolving to list of US accounts with balances
   *
   * @example
   * ```typescript
   * // List all US accounts for the authenticated holder
   * const result = await bloque.accounts.us.list();
   *
   * // List US accounts for a specific holder
   * const result = await bloque.accounts.us.list({
   *   holderUrn: 'did:bloque:bloque-root:nestor'
   * });
   *
   * // Get a specific US account
   * const result = await bloque.accounts.us.list({
   *   urn: 'did:bloque:account:us-account:usr-123:us-456'
   * });
   * ```
   */
  async list(params?: ListUsAccountsParams): Promise<ListUsAccountsResult> {
    const holderUrn = params?.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    queryParams.append('medium', 'us-account');

    if (holderUrn) {
      queryParams.append('holder_urn', holderUrn);
    }

    if (params?.urn) {
      queryParams.append('urn', params.urn);
    }

    const path = `/api/accounts?${queryParams.toString()}`;

    const response = await this.httpClient.request<
      ListAccountsResponse<UsDetails>
    >({
      method: 'GET',
      path,
    });

    return {
      accounts: response.accounts.map((account) => ({
        urn: account.urn,
        id: account.id,
        type: account.details.type,
        firstName: account.details.first_name,
        middleName: account.details.middle_name,
        lastName: account.details.last_name,
        email: account.details.email,
        phone: account.details.phone,
        address: {
          streetLine1: account.details.address.street_line_1,
          streetLine2: account.details.address.street_line_2,
          city: account.details.address.city,
          state: account.details.address.state,
          postalCode: account.details.address.postal_code,
          country: account.details.address.country,
        },
        birthDate: account.details.birth_date,
        accountNumber: account.details.account_number,
        routingNumber: account.details.routing_number,
        status: account.status,
        ownerUrn: account.owner_urn,
        ledgerId: account.ledger_account_id,
        webhookUrl: account.webhook_url,
        metadata: account.metadata,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        balance: account.balance,
      })),
    };
  }

  /**
   * Update US account metadata
   *
   * @param params - Metadata update parameters
   * @returns Promise resolving to the updated US account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.us.updateMetadata({
   *   urn: 'did:bloque:mediums:us-account:account:123',
   *   metadata: {
   *     updated_by: 'admin',
   *     update_reason: 'customer_request'
   *   }
   * });
   * ```
   */
  async updateMetadata(params: UpdateUsMetadataParams): Promise<UsAccount> {
    const request: UpdateAccountRequest = {
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<UsDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${params.urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Activate a US account
   *
   * @param urn - US account URN
   * @returns Promise resolving to the updated US account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.us.activate(
   *   'did:bloque:mediums:us-account:account:123'
   * );
   * ```
   */
  async activate(urn: string): Promise<UsAccount> {
    return this._updateStatus(urn, 'active');
  }

  /**
   * Freeze a US account
   *
   * @param urn - US account URN
   * @returns Promise resolving to the updated US account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.us.freeze(
   *   'did:bloque:mediums:us-account:account:123'
   * );
   * ```
   */
  async freeze(urn: string): Promise<UsAccount> {
    return this._updateStatus(urn, 'frozen');
  }

  /**
   * Disable a US account
   *
   * @param urn - US account URN
   * @returns Promise resolving to the updated US account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.us.disable(
   *   'did:bloque:mediums:us-account:account:123'
   * );
   * ```
   */
  async disable(urn: string): Promise<UsAccount> {
    return this._updateStatus(urn, 'disabled');
  }

  /**
   * Private method to poll account status until it becomes active
   */
  private async _waitForActiveStatus(
    urn: string,
    timeout: number,
  ): Promise<UsAccount> {
    const startTime = Date.now();
    const pollingInterval = 2000; // 2 seconds

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
   * Private method to update account status
   */
  private async _updateStatus(
    urn: string,
    status: 'active' | 'frozen' | 'disabled',
  ): Promise<UsAccount> {
    const request: UpdateAccountRequest = {
      status,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<UsDetails>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Private method to map API response to UsAccount
   */
  private _mapAccountResponse(
    account: UpdateAccountResponse<UsDetails>['result']['account'],
  ): UsAccount {
    return {
      urn: account.urn,
      id: account.id,
      type: account.details.type,
      firstName: account.details.first_name,
      middleName: account.details.middle_name,
      lastName: account.details.last_name,
      email: account.details.email,
      phone: account.details.phone,
      address: {
        streetLine1: account.details.address.street_line_1,
        streetLine2: account.details.address.street_line_2,
        city: account.details.address.city,
        state: account.details.address.state,
        postalCode: account.details.address.postal_code,
        country: account.details.address.country,
      },
      birthDate: account.details.birth_date,
      accountNumber: account.details.account_number,
      routingNumber: account.details.routing_number,
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
