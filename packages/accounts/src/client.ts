import type { HttpClient } from '@bloque/sdk-core';
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
export class AccountsClient {
  private readonly httpClient: HttpClient;
  readonly bancolombia: BancolombiaClient;
  readonly card: CardClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.bancolombia = new BancolombiaClient(this.httpClient);
    this.card = new CardClient(this.httpClient);
  }
}
