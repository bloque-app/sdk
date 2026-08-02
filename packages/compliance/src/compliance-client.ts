import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import { KycClient } from './kyc/kyc-client';
import { TiersClient } from './tiers/tiers-client';
import { TosGateClient } from './tos-gate/tos-gate-client';
import { VerificationGateClient } from './verification-gate/verification-gate-client';

export class ComplianceClient extends BaseClient {
  readonly kyc: KycClient;
  /** Read an identity's effective tier and requirement status. */
  readonly tiers: TiersClient;
  /** Level 0 TOS gate — hosted acceptance flow. */
  readonly tosGate: TosGateClient;
  /** Phase 3 hosted verification gate — document/form submission flow. */
  readonly verificationGate: VerificationGateClient;

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.kyc = new KycClient(this.httpClient);
    this.tiers = new TiersClient(this.httpClient);
    this.tosGate = new TosGateClient(this.httpClient);
    this.verificationGate = new VerificationGateClient(this.httpClient);
  }
}
