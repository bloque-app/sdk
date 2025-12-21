import { AccountsClient } from '@bloque/sdk-accounts';
import { ComplianceClient } from '@bloque/sdk-compliance';
import { type BloqueConfig, HttpClient } from '@bloque/sdk-core';
import { OrgsClient } from '@bloque/sdk-orgs';

export class SDK {
  private readonly httpClient: HttpClient;
  public readonly orgs: OrgsClient;
  public readonly compliance: ComplianceClient;
  public readonly accounts: AccountsClient;

  constructor(config: BloqueConfig) {
    this.httpClient = new HttpClient(config);
    this.orgs = new OrgsClient(this.httpClient);
    this.compliance = new ComplianceClient(this.httpClient);
    this.accounts = new AccountsClient(this.httpClient);
  }
}
