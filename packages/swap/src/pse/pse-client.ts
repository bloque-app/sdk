import { BaseClient } from '@bloque/sdk-core';
import type { ListPseBanksResponse, PseBank } from '../internal/wire-types';
import type { Bank, ListBanksResult } from './types';

/**
 * PSE client for PSE-related utilities
 *
 * Provides access to PSE (Pagos Seguros en Línea) utilities like bank listing.
 */
export class PseClient extends BaseClient {
  /**
   * List available PSE banks
   *
   * Retrieves the list of financial institutions available for PSE payments.
   *
   * @returns Promise resolving to list of banks
   *
   * @example
   * ```typescript
   * const result = await bloque.swap.pse.banks();
   *
   * for (const bank of result.banks) {
   *   console.log(`${bank.code}: ${bank.name}`);
   * }
   * ```
   */
  async banks(): Promise<ListBanksResult> {
    const response = await this.httpClient.request<ListPseBanksResponse>({
      method: 'GET',
      path: '/api/utils/pse/banks',
    });

    return {
      banks: response.banks.map((bank) => this._mapBankResponse(bank)),
    };
  }

  /**
   * Maps API bank response to SDK format
   * @internal
   */
  private _mapBankResponse(bank: PseBank): Bank {
    return {
      code: bank.financial_institution_code,
      name: bank.financial_institution_name,
    };
  }
}
