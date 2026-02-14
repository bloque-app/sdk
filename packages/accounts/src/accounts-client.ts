import type { HttpClient } from '@bloque/sdk-core';
import {
  BaseClient,
  isSupportedAsset,
  SUPPORTED_ASSETS,
} from '@bloque/sdk-core';
import {
  BancolombiaClient,
  mapBancolombiaAccountFromWire,
} from './bancolombia/bancolombia-client';
import type { BancolombiaAccount } from './bancolombia/types';
import { CardClient, mapCardAccountFromWire } from './card/card-client';
import type { CardAccount, ListMovementsParams } from './card/types';
import type {
  AccountWithBalance,
  BancolombiaDetails,
  BatchTransferRequest,
  BatchTransferResponse,
  CardDetails,
  GetAccountResponse,
  GetBalanceResponse,
  GetBalancesResponse,
  ListAccountsResponse,
  ListMovementsResponse,
  ListTransactionsResponse,
  PolygonDetails,
  TransferRequest,
  TransferResponse,
  UsDetails,
  VirtualDetails,
} from './internal/wire-types';
import {
  mapPolygonAccountFromWire,
  PolygonClient,
} from './polygon/polygon-client';
import type { PolygonAccount } from './polygon/types';
import type {
  BatchTransferChunkResult,
  BatchTransferParams,
  BatchTransferResult,
  GeneralTokenBalance,
  ListAccountsParams,
  ListAccountsResult,
  ListMovementsResult,
  ListTransactionsParams,
  ListTransactionsResult,
  Movement,
  TokenBalance,
  TransferParams,
  TransferResult,
} from './types';
import type { UsAccount } from './us/types';
import { mapUsAccountFromWire, UsClient } from './us/us-client';
import type { VirtualAccount } from './virtual/types';
import {
  mapVirtualAccountFromWire,
  VirtualClient,
} from './virtual/virtual-client';

/**
 * Union of all medium-specific mapped account types.
 * Returned by `AccountsClient.get()` and used in `AccountsClient.list()`.
 */
export type MappedAccount =
  | CardAccount
  | VirtualAccount
  | PolygonAccount
  | BancolombiaAccount
  | UsAccount;

/**
 * Accounts client for managing financial accounts and payment methods
 *
 * Provides access to various account types through specialized sub-clients:
 * - card: Credit/debit cards
 * - virtual: Virtual accounts
 * - bancolombia: Bancolombia accounts
 * - us: US bank accounts
 * - polygon: Polygon wallets
 */
export class AccountsClient extends BaseClient {
  readonly bancolombia: BancolombiaClient;
  readonly card: CardClient;
  readonly polygon: PolygonClient;
  readonly us: UsClient;
  readonly virtual: VirtualClient;

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.bancolombia = new BancolombiaClient(this.httpClient);
    this.card = new CardClient(this.httpClient);
    this.polygon = new PolygonClient(this.httpClient);
    this.us = new UsClient(this.httpClient);
    this.virtual = new VirtualClient(this.httpClient);
  }

  /**
   * Get account balance by URN
   *
   * Retrieves current and pending balance for a specific account.
   * Returns balances by asset (e.g. DUSD/6, KSM/12) with current, pending, in, and out.
   *
   * @param urn - Account URN (e.g. did:bloque:mediums:virtual:account:acc-123)
   * @returns Promise resolving to balance by asset
   *
   * @example
   * ```typescript
   * const balance = await bloque.accounts.balance(
   *   'did:bloque:mediums:virtual:account:acc-12345',
   * );
   * Object.entries(balance).forEach(([asset, b]) => {
   *   console.log(`${asset}: current=${b.current}, pending=${b.pending}`);
   * });
   * ```
   */
  async balance(urn: string): Promise<Record<string, TokenBalance>> {
    if (!urn?.trim()) {
      throw new Error('Account URN is required');
    }

    const response = await this.httpClient.request<GetBalanceResponse>({
      method: 'GET',
      path: `/api/accounts/${urn}/balance`,
    });

    return response.balance;
  }

  /**
   * Get general balances for the authenticated holder
   *
   * Retrieves aggregated balances by asset (e.g. DUSD/6, KSM/12) across accounts.
   * Some assets may only include current and pending values.
   *
   * @returns Promise resolving to balances by asset
   *
   * @example
   * ```typescript
   * const balances = await bloque.accounts.balances();
   * console.log(balances['DUSD/6']?.current);
   * ```
   */
  async balances(): Promise<Record<string, GeneralTokenBalance>> {
    const response = await this.httpClient.request<GetBalancesResponse>({
      method: 'GET',
      path: '/api/accounts/balances',
    });

    return response.balance;
  }

  /**
   * Get account by URN
   *
   * Retrieves full account details including balance for a specific account.
   *
   * @param urn - Account URN (e.g. did:bloque:mediums:virtual:account:acc-123)
   * @returns Promise resolving to the account
   *
   * @example
   * ```typescript
   * const account = await bloque.accounts.get(
   *   'did:bloque:mediums:virtual:account:acc-12345',
   * );
   * console.log(account.status, account.balance);
   * ```
   */
  async get(urn: string): Promise<MappedAccount> {
    if (!urn?.trim()) {
      throw new Error('Account URN is required');
    }

    const response = await this.httpClient.request<GetAccountResponse>({
      method: 'GET',
      path: `/api/accounts/${urn}`,
    });

    return this._mapByMedium(response.account);
  }

  /**
   * List accounts
   *
   * Retrieves a list of accounts, optionally filtered by holder URN.
   *
   * @param params - List parameters (optional)
   * @returns Promise resolving to list of accounts
   *
   * @example
   * ```typescript
   * // List all accounts for the authenticated holder
   * const result = await bloque.accounts.list();
   *
   * // List accounts for a specific holder
   * const result = await bloque.accounts.list({
   *   medium: 'card'
   * });
   * ```
   */
  async list(params?: ListAccountsParams): Promise<ListAccountsResult> {
    const holderUrn = params?.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    if (holderUrn) {
      queryParams.append('holder_urn', holderUrn);
    }

    const queryString = queryParams.toString();
    const path = queryString ? `/api/accounts?${queryString}` : '/api/accounts';

    const response = await this.httpClient.request<ListAccountsResponse>({
      method: 'GET',
      path,
    });

    return {
      accounts: response.accounts.map((account) => this._mapByMedium(account)),
    };
  }

  /**
   * Transfer funds between accounts
   *
   * @param params - Transfer parameters
   * @returns Promise resolving to transfer result
   *
   * @example
   * ```typescript
   * const transfer = await bloque.accounts.transfer({
   *   sourceUrn: 'did:bloque:account:card:usr-123:crd-456',
   *   destinationUrn: 'did:bloque:account:virtual:acc-67890',
   *   amount: '1000000000000',
   *   asset: 'KSM/12',
   *   metadata: {
   *     reference: 'payment-123',
   *     note: 'Monthly subscription'
   *   }
   * });
   * ```
   */
  async transfer(params: TransferParams): Promise<TransferResult> {
    const asset = params.asset || 'DUSD/6';
    if (!isSupportedAsset(asset)) {
      throw new Error(
        `Invalid asset type "${asset}". Supported assets: ${SUPPORTED_ASSETS.join(', ')}`,
      );
    }

    const request: TransferRequest = {
      destination_account_urn: params.destinationUrn,
      amount: params.amount,
      asset: asset,
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<TransferResponse>({
      method: 'POST',
      path: `/api/accounts/${params.sourceUrn}/transfer`,
      body: request,
    });

    return {
      queueId: response.result.queue_id,
      status: response.result.status,
      message: response.result.message,
    };
  }

  /**
   * Batch transfer funds between multiple accounts
   *
   * Executes multiple transfer operations in a single batch transaction.
   * Large batches are automatically split into chunks of max 80 operations.
   *
   * @param params - Batch transfer parameters
   * @returns Promise resolving to batch transfer result
   *
   * @example
   * ```typescript
   * const result = await bloque.accounts.batchTransfer({
   *   reference: 'batch-payroll-2024-01-15',
   *   operations: [
   *     {
   *       fromUrn: 'did:bloque:account:virtual:acc-12345',
   *       toUrn: 'did:bloque:account:virtual:acc-67890',
   *       reference: 'transfer-001',
   *       amount: '1000000000000',
   *       asset: 'KSM/12',
   *       metadata: { note: 'Payment for order #123' }
   *     },
   *     {
   *       fromUrn: 'did:bloque:account:virtual:acc-12345',
   *       toUrn: 'did:bloque:account:card:usr-456:crd-789',
   *       reference: 'transfer-002',
   *       amount: '500000000000',
   *       asset: 'KSM/12'
   *     }
   *   ],
   *   metadata: { batch_id: 'batch-2024-01-15' },
   *   webhookUrl: 'https://api.example.com/webhooks/batch-settlement'
   * });
   * ```
   */
  async batchTransfer(
    params: BatchTransferParams,
  ): Promise<BatchTransferResult> {
    if (!params.operations || params.operations.length === 0) {
      throw new Error('At least one operation is required');
    }

    if (!params.reference) {
      throw new Error('Batch reference is required');
    }

    // Validate all operations
    for (const op of params.operations) {
      if (!isSupportedAsset(op.asset)) {
        throw new Error(
          `Invalid asset type "${op.asset}" in operation "${op.reference}". Supported assets: ${SUPPORTED_ASSETS.join(', ')}`,
        );
      }
    }

    const request: BatchTransferRequest = {
      operations: params.operations.map((op) => ({
        from_account_urn: op.fromUrn,
        to_account_urn: op.toUrn,
        reference: op.reference,
        amount: op.amount,
        asset: op.asset,
        metadata: op.metadata,
      })),
      reference: params.reference,
      metadata: params.metadata,
      webhook_url: params.webhookUrl,
    };

    const response = await this.httpClient.request<BatchTransferResponse>({
      method: 'POST',
      path: '/api/accounts/batch/transfer',
      body: request,
    });

    const chunks: BatchTransferChunkResult[] = response.result.chunks.map(
      (chunk) => ({
        queueId: chunk.queue_id,
        status: chunk.status,
        message: chunk.message,
      }),
    );

    return {
      chunks,
      totalOperations: response.result.total_operations,
      totalChunks: response.result.total_chunks,
    };
  }

  /**
   * List account movements/transactions
   *
   * Retrieves transaction history for a specific account using its URN.
   * Returns a paged result with data, pageSize, hasMore, and optional next token.
   *
   * @param params - Movement list parameters
   * @returns Promise resolving to paged movements result
   *
   * @example
   * ```typescript
   * // Basic usage
   * const { data, pageSize, hasMore, next } = await bloque.accounts.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   * });
   *
   * // With filters
   * const result = await bloque.accounts.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   *   limit: 50,
   *   direction: 'in',
   *   after: '2025-01-01T00:00:00Z',
   * });
   *
   * // Next page
   * if (result.hasMore && result.next) {
   *   const nextPage = await bloque.accounts.movements({
   *     urn: params.urn,
   *     asset: params.asset,
   *     next: result.next,
   *   });
   * }
   *
   * // Filter by pocket (main = confirmed, pending = pending movements)
   * const confirmed = await bloque.accounts.movements({
   *   urn: 'did:bloque:account:virtual:acc-123',
   *   asset: 'KSM/12',
   *   pocket: 'main',
   * });
   * ```
   */
  async movements(params: ListMovementsParams): Promise<ListMovementsResult> {
    if (!params.urn) {
      throw new Error('Account URN is required');
    }

    const asset = params.asset || 'DUSD/6';
    if (!isSupportedAsset(asset)) {
      throw new Error(
        `Invalid asset type "${asset}". Supported assets: ${SUPPORTED_ASSETS.join(', ')}`,
      );
    }

    const queryParams = new URLSearchParams();
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

    const path = `/api/accounts/${params.urn}/movements?${queryParams.toString()}`;

    const response = await this.httpClient.request<ListMovementsResponse>({
      method: 'GET',
      path,
    });

    return {
      data: response.data.map((tx) => ({
        amount: tx.amount,
        asset: tx.asset,
        fromAccountId: tx.from_account_id,
        toAccountId: tx.to_account_id,
        direction: tx.direction,
        type: tx.type,
        reference: tx.reference,
        status: tx.status,
        railName: tx.rail_name,
        details: tx.details,
        createdAt: tx.created_at,
      })),
      pageSize: response.page_size,
      hasMore: response.has_more,
      next: response.next,
    };
  }

  /**
   * List transactions across all accounts (cards, virtual, polygon, etc.)
   *
   * This endpoint does not require account URN.
   *
   * @param params - Transaction list parameters
   * @returns Promise resolving to paged transactions result
   *
   * @example
   * ```typescript
   * const result = await bloque.accounts.transactions({
   *   asset: 'DUSD/6',
   *   limit: 10,
   * });
   *
   * if (result.hasMore && result.next) {
   *   const nextPage = await bloque.accounts.transactions({
   *     asset: 'DUSD/6',
   *     next: result.next,
   *   });
   * }
   * ```
   */
  async transactions(
    params: ListTransactionsParams = {},
  ): Promise<ListTransactionsResult> {
    const asset = params.asset || 'DUSD/6';
    if (!isSupportedAsset(asset)) {
      throw new Error(
        `Invalid asset type "${asset}". Supported assets: ${SUPPORTED_ASSETS.join(', ')}`,
      );
    }

    const queryParams = new URLSearchParams();
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

    const response = await this.httpClient.request<ListTransactionsResponse>({
      method: 'GET',
      path: `/api/accounts/transactions?${queryParams.toString()}`,
    });

    return {
      data: response.data.map((tx) => ({
        amount: tx.amount,
        asset: tx.asset,
        fromAccountId: tx.from_account_id,
        toAccountId: tx.to_account_id,
        direction: tx.direction,
        reference: tx.reference,
        status: tx.status,
        railName: tx.rail_name,
        details: tx.details ?? {},
        createdAt: tx.created_at,
        type: tx.type,
      })),
      pageSize: response.page_size,
      hasMore: response.has_more,
      next: response.next,
    };
  }

  /**
   * Dispatches the wire account to the correct per-medium mapper.
   * Returns a properly typed account (CardAccount, VirtualAccount, etc.)
   * instead of a generic Account with raw details.
   *
   * @internal
   */
  private _mapByMedium(
    account: ListAccountsResponse['accounts'][0],
  ): MappedAccount {
    switch (account.medium) {
      case 'card':
        return mapCardAccountFromWire(
          account as AccountWithBalance<CardDetails>,
        );
      case 'virtual':
        return mapVirtualAccountFromWire(
          account as AccountWithBalance<VirtualDetails>,
        );
      case 'polygon':
        return mapPolygonAccountFromWire(
          account as AccountWithBalance<PolygonDetails>,
        );
      case 'bancolombia':
        return mapBancolombiaAccountFromWire(
          account as AccountWithBalance<BancolombiaDetails>,
        );
      case 'us-account':
        return mapUsAccountFromWire(account as AccountWithBalance<UsDetails>);
      default:
        throw new Error(`Unknown account medium: ${account.medium}`);
    }
  }
}
