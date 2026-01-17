import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import { BancolombiaClient } from './bancolombia/bancolombia-client';
import { CardClient } from './card/card-client';
import type { ListMovementsParams } from './card/types';
import type {
  ListAccountsResponse,
  ListMovementsResponse,
  TransferRequest,
  TransferResponse,
} from './internal/wire-types';
import { PolygonClient } from './polygon/polygon-client';
import type {
  Account,
  ListAccountsParams,
  ListAccountsResult,
  Movement,
  TokenBalance,
  TransferParams,
  TransferResult,
} from './types';
import { UsClient } from './us/us-client';
import { VirtualClient } from './virtual/virtual-client';

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
      accounts: response.accounts.map((account) =>
        this._mapAccountResponse(account),
      ),
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
    if (asset !== 'DUSD/6' && asset !== 'KSM/12') {
      throw new Error('Invalid asset type. Supported assets are USD and KSM.');
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
   * List account movements/transactions
   *
   * Retrieves transaction history for a specific account using its URN.
   *
   * @param params - Movement list parameters
   * @returns Promise resolving to array of movements
   *
   * @example
   * ```typescript
   * // Basic usage
   * const movements = await bloque.accounts.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   * });
   *
   * // With filters
   * const recentMovements = await bloque.accounts.movements({
   *   urn: 'did:bloque:account:card:usr-123:crd-456',
   *   asset: 'DUSD/6',
   *   limit: 50,
   *   direction: 'in',
   *   after: '2025-01-01T00:00:00Z',
   * });
   * ```
   */
  async movements(params: ListMovementsParams): Promise<Movement[]> {
    if (!params.urn) {
      throw new Error('Account URN is required');
    }

    const asset = params.asset || 'DUSD/6';
    if (asset !== 'DUSD/6' && asset !== 'KSM/12') {
      throw new Error(
        'Invalid asset type. Supported assets are DUSD/6 and KSM/12.',
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

    const path = `/api/accounts/${params.urn}/movements?${queryParams.toString()}`;

    const response = await this.httpClient.request<ListMovementsResponse>({
      method: 'GET',
      path,
    });

    return response.transactions.map((tx) => ({
      amount: tx.amount,
      asset: tx.asset,
      fromAccountId: tx.from_account_id,
      toAccountId: tx.to_account_id,
      direction: tx.direction,
      reference: tx.reference,
      railName: tx.rail_name,
      details: {
        metadata: tx.details.metadata,
        type: tx.details.type,
      },
      createdAt: tx.created_at,
    }));
  }

  /**
   * Maps API account response to SDK format
   * @internal
   */
  private _mapAccountResponse<TDetails = unknown>(
    account: ListAccountsResponse['accounts'][0],
  ): Account<TDetails> {
    const balance: Record<string, TokenBalance> = {};
    for (const [asset, balanceData] of Object.entries(account.balance)) {
      balance[asset] = {
        current: balanceData.current,
        pending: balanceData.pending,
        in: balanceData.in,
        out: balanceData.out,
      };
    }

    return {
      id: account.id,
      urn: account.urn,
      medium: account.medium,
      details: account.details as TDetails,
      ledgerId: account.ledger_account_id,
      status: account.status,
      ownerUrn: account.owner_urn,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
      webhookUrl: account.webhook_url,
      metadata: account.metadata,
      balance,
    };
  }
}
