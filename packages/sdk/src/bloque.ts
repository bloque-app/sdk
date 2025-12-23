import { AccountsClient } from '@bloque/sdk-accounts';
import { ComplianceClient } from '@bloque/sdk-compliance';
import { type BloqueConfig, HttpClient } from '@bloque/sdk-core';
import { IdentityClient } from '@bloque/sdk-identity';
import { OrgsClient } from '@bloque/sdk-orgs';

export class SDK {
  private readonly httpClient: HttpClient;
  public readonly accounts: AccountsClient;
  public readonly compliance: ComplianceClient;
  public readonly identity: IdentityClient;
  public readonly orgs: OrgsClient;

  constructor(config: BloqueConfig) {
    this.httpClient = new HttpClient(config);
    this.accounts = new AccountsClient(this.httpClient);
    this.compliance = new ComplianceClient(this.httpClient);
    this.identity = new IdentityClient(this.httpClient);
    this.orgs = new OrgsClient(this.httpClient);
  }
}
