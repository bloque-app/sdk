import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import { KycClient } from './kyc/client';

export class ComplianceClient extends BaseClient {
  readonly kyc: KycClient;

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.kyc = new KycClient(this.httpClient);
  }
}
