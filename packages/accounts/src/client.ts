import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import type {
  TransferParams,
  TransferRequest,
  TransferResponse,
  TransferResult,
} from './api-types';
import { BancolombiaClient } from './bancolombia/client';
import { CardClient } from './card/client';

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

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.bancolombia = new BancolombiaClient(this.httpClient);
    this.card = new CardClient(this.httpClient);
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
}
