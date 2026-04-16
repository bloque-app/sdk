import {
  BaseClient,
  isSupportedAsset,
  SUPPORTED_ASSETS,
} from '@bloque/sdk-core';
import type {
  AccountStatus,
  AccountWithBalance,
  CardDetails,
  CreateAccountRequest,
  CreateAccountResponse,
  CreateCardAccountInput,
  GetBalanceResponse,
  ListAccountsResponse,
  ListMovementsResponse,
  TokenBalance,
  TokenizeAppleCardRequest,
  TokenizeAppleCardResponse,
  TokenizeGoogleCardRequest,
  TokenizeGoogleCardResponse,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  CardAccount,
  CreateCardParams,
  GetBalanceParams,
  ListCardAccountsParams,
  ListCardAccountsResult,
  ListMovementsPagedResult,
  ListMovementsParams,
  TokenizeAppleParams,
  TokenizeAppleResult,
  TokenizeGoogleParams,
  TokenizeGoogleResult,
  UpdateCardMetadataParams,
  UpdateCardParams,
} from './types';

/**
 * Maps a wire card account to the SDK CardAccount type.
 * Exported so AccountsClient.get() can dispatch by medium.
 */
export function mapCardAccountFromWire(
  account: AccountWithBalance<CardDetails>,
): CardAccount {
  return {
    urn: account.urn,
    id: account.id,
    medium: 'card',
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
  };
}

export class CardClient extends BaseClient {
  /**
   * Create a new card account
   *
   * @param params - Card creation parameters
   * @param options - Creation options (optional)
   * @returns Promise resolving to the created card account
   *
   * @example
   * ```typescript
   * // Create without waiting
   * const card = await bloque.accounts.card.create({
   *   name: 'My Card',
   * });
   *
   * // Create and wait for active status
   * const card = await bloque.accounts.card.create({
   *   name: 'My Card',
   * }, { waitLedger: true });
   * ```
   */
  async create(
    params: CreateCardParams = {},
    options?: CreateAccountOptions,
  ): Promise<CardAccount> {
    const request: CreateAccountRequest<CreateCardAccountInput> = {
      holder_urn: params?.holderUrn || this.httpClient.urn || '',
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
  ): Promise<CardAccount> {
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
   * List card accounts
   *
   * Retrieves a list of card accounts, optionally filtered by holder URN or specific account URN.
   *
   * @param params - List parameters (optional)
   * @returns Promise resolving to list of card accounts with balances
   *
   * @example
   * ```typescript
   * // List all card accounts for the authenticated holder
   * const result = await bloque.accounts.card.list();
   *
   * // List card accounts for a specific holder
   * const result = await bloque.accounts.card.list({
   *   holderUrn: 'did:bloque:bloque-root:nestor'
   * });
   *
   * // Get a specific card account
   * const result = await bloque.accounts.card.list({
   *   urn: 'did:bloque:account:card:usr-123:crd-456'
   * });
   * ```
   */
  async list(params?: ListCardAccountsParams): Promise<ListCardAccountsResult> {
    const holderUrn = params?.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    queryParams.append('medium', 'card');

    if (holderUrn) {
      queryParams.append('holder_urn', holderUrn);
    }

    if (params?.urn) {
      queryParams.append('urn', params.urn);
    }

    const path = `/api/accounts?${queryParams.toString()}`;

    const response = await this.httpClient.request<
      ListAccountsResponse<CardDetails>
    >({
      method: 'GET',
      path,
    });

    return {
      accounts: response.accounts.map((account) =>
        mapCardAccountFromWire(account as AccountWithBalance<CardDetails>),
      ),
    };
  }

  /**
   * List card account movements/transactions
   *
   * Returns a paged result with data, pageSize, hasMore, and optional next token.
   *
   * @param params - Movement list parameters
   * @returns Promise resolving to paged card movements result
   *
   * @example
   * ```typescript
   * // Basic usage
   * const { data, pageSize, hasMore, next } = await bloque.accounts.card.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   * });
   *
   * // With pagination and filters
   * const result = await bloque.accounts.card.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   *   limit: 50,
   *   direction: 'in',
   *   after: '2025-01-01T00:00:00Z',
   * });
   *
   * // Next page
   * if (result.hasMore && result.next) {
   *   const nextPage = await bloque.accounts.card.movements({
   *     urn: params.urn,
   *     asset: params.asset,
   *     next: result.next,
   *   });
   * }
   *
   * // Filter by pocket (main = confirmed, pending = pending movements)
   * const confirmed = await bloque.accounts.card.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   *   pocket: 'main',
   * });
   * ```
   */
  async movements(
    params: ListMovementsParams,
  ): Promise<ListMovementsPagedResult> {
    const queryParams = new URLSearchParams();

    const asset = params.asset || 'DUSD/6';
    if (!isSupportedAsset(asset)) {
      throw new Error(
        `Invalid asset type "${asset}". Supported assets: ${SUPPORTED_ASSETS.join(', ')}`,
      );
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

    if (params.collapsed_view !== undefined) {
      queryParams.set('collapsed_view', String(params.collapsed_view));
    }

    if (params.pocket) {
      queryParams.set('pocket', params.pocket);
    }

    if (params.next) {
      queryParams.set('next', params.next);
    }

    const queryString = queryParams.toString();
    const path = `/api/accounts/${params.urn}/movements${queryString ? `?${queryString}` : ''}`;

    const response = await this.httpClient.request<ListMovementsResponse>({
      method: 'GET',
      path,
    });

    return {
      data: response.data,
      pageSize: response.page_size,
      hasMore: response.has_more,
      next: response.next,
    };
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
   * Update a card account (metadata, webhook URL, ledger ID, or status)
   *
   * @param params - Update parameters
   * @returns Promise resolving to the updated card account
   *
   * @example
   * ```typescript
   * const card = await bloque.accounts.card.update({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   webhookUrl: 'https://api.example.com/webhooks/cards',
   *   metadata: { name: 'Updated Card' },
   * });
   * ```
   */
  async update(params: UpdateCardParams): Promise<CardAccount> {
    const request: UpdateAccountRequest = {
      ...(params.metadata && { metadata: params.metadata }),
      ...(params.status && { status: params.status as AccountStatus }),
      ...(params.webhookUrl && { webhook_url: params.webhookUrl }),
      ...(params.ledgerId && { ledger_account_id: params.ledgerId }),
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
   * Tokenize a card for Apple Pay
   *
   * @param urn - Card account URN
   * @param params - Apple Pay tokenization parameters
   * @returns Promise resolving to tokenization data
   *
   * @example
   * ```typescript
   * const result = await bloque.accounts.card.tokenizeApple(
   *   'did:bloque:mediums:card:account:123',
   *   {
   *     certificates: ['cert1', 'cert2'],
   *     nonce: 'random_nonce',
   *     nonceSignature: 'signed_nonce',
   *   },
   * );
   * console.log(result.activationData);
   * ```
   */
  async tokenizeApple(
    urn: string,
    params: TokenizeAppleParams,
  ): Promise<TokenizeAppleResult> {
    const request: TokenizeAppleCardRequest = {
      certificates: params.certificates,
      nonce: params.nonce,
      nonce_signature: params.nonceSignature,
    };

    const response = await this.httpClient.request<TokenizeAppleCardResponse>({
      method: 'POST',
      path: `/api/accounts/${urn}/tokenize/apple`,
      body: request,
    });

    return {
      activationData: response.result.tokenization.activation_data,
      encryptedPassData: response.result.tokenization.encrypted_pass_data,
      ephemeralPublicKey: response.result.tokenization.ephemeral_public_key,
    };
  }

  /**
   * Tokenize a card for Google Pay
   *
   * @param urn - Card account URN
   * @param params - Google Pay tokenization parameters
   * @returns Promise resolving to tokenization data
   *
   * @example
   * ```typescript
   * const result = await bloque.accounts.card.tokenizeGoogle(
   *   'did:bloque:mediums:card:account:123',
   *   {
   *     deviceId: 'device_123',
   *     walletAccountId: 'wallet_456',
   *   },
   * );
   * console.log(result.opc);
   * ```
   */
  async tokenizeGoogle(
    urn: string,
    params: TokenizeGoogleParams,
  ): Promise<TokenizeGoogleResult> {
    const request: TokenizeGoogleCardRequest = {
      device_id: params.deviceId,
      wallet_account_id: params.walletAccountId,
    };

    const response = await this.httpClient.request<TokenizeGoogleCardResponse>({
      method: 'POST',
      path: `/api/accounts/${urn}/tokenize/google`,
      body: request,
    });

    return {
      opc: response.result.tokenization.opc,
    };
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
    return mapCardAccountFromWire(account as AccountWithBalance<CardDetails>);
  }
}
