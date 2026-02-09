import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import { BankTransferClient } from './bank-transfer/bank-transfer-client';
import type { FindRatesResponse, Rate } from './internal/wire-types';
import { PseClient } from './pse/pse-client';
import type { FindRatesParams, FindRatesResult, SwapRate } from './types';

/**
 * Swap client for finding exchange rates
 *
 * Provides access to exchange rate discovery and swapping functionality.
 * - pse: PSE utilities (bank listing, etc.)
 * - bankTransfer: Generic bank transfer cash-out (supports all Colombian banks)
 */
export class SwapClient extends BaseClient {
  readonly pse: PseClient;
  readonly bankTransfer: BankTransferClient;

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.pse = new PseClient(this.httpClient);
    this.bankTransfer = new BankTransferClient(this.httpClient);
  }
  /**
   * Find available exchange rates
   *
   * Retrieves exchange rates for a given asset pair and optional filters.
   *
   * @param params - Rate search parameters
   * @returns Promise resolving to available rates
   *
   * @example
   * ```typescript
   * const result = await bloque.swap.findRates({
   *   fromAsset: 'COP/2',
   *   toAsset: 'DUSD/6',
   *   fromMediums: ['bancolombia'],
   *   toMediums: ['kusama'],
   *   amountSrc: '50000000' // 500000.00 COP (scaled by 2 decimals)
   * });
   *
   * console.log(result.rates[0].ratio);
   * ```
   */
  async findRates(params: FindRatesParams): Promise<FindRatesResult> {
    const queryParams = new URLSearchParams();

    // Build edge parameter as JSON array [from_asset, to_asset]
    const edge = JSON.stringify([params.fromAsset, params.toAsset]);
    queryParams.append('edge', edge);

    // Add required from_medium as JSON array
    queryParams.append('from_medium', JSON.stringify(params.fromMediums));

    // Add required to_medium as JSON array
    queryParams.append('to_medium', JSON.stringify(params.toMediums));

    // Add optional amount parameters (provide one or the other, not both)
    if (params.amountSrc !== undefined) {
      queryParams.append('amount_src', params.amountSrc);
    }

    if (params.amountDst !== undefined) {
      queryParams.append('amount_dst', params.amountDst);
    }

    // Add optional sorting parameters
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    if (params.sortBy) {
      queryParams.append('sort_by', params.sortBy);
    }

    const queryString = queryParams.toString();
    const path = `/api/rates?${queryString}`;

    const response = await this.httpClient.request<FindRatesResponse>({
      method: 'GET',
      path,
    });

    return {
      rates: response.rates.map((rate) => this._mapRateResponse(rate)),
    };
  }

  /**
   * Maps API rate response to SDK format
   * @internal
   */
  private _mapRateResponse(rate: Rate): SwapRate {
    return {
      id: rate.id,
      sig: rate.sig,
      swapSig: rate.swap_sig,
      maker: rate.maker,
      edge: rate.edge,
      fee: {
        at: rate.fee.at,
        value: rate.fee.value,
        formula: rate.fee.formula,
        components: rate.fee.components.map((component) => ({
          at: component.at,
          name: component.name,
          type: component.type,
          value: component.value,
          percentage: component.percentage,
          pair: component.pair,
          amount: component.amount,
        })),
      },
      at: rate.at,
      until: rate.until,
      fromMediums: rate.from_medium,
      toMediums: rate.to_medium,
      rate: rate.rate,
      ratio: rate.ratio,
      fromLimits: rate.from_limits,
      toLimits: rate.to_limits,
      createdAt: rate.created_at,
      updatedAt: rate.updated_at,
    };
  }
}
