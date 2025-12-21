import type { HttpClient } from '@bloque/sdk-core';
import { KycClient } from './kyc/client';

export class ComplianceClient {
  private readonly httpClient: HttpClient;
  readonly kyc: KycClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.kyc = new KycClient(this.httpClient);
  }
}
