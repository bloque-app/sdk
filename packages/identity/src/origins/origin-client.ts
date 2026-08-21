import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';

export class OriginClient<TAssertion> extends BaseClient {
  constructor(
    httpClient: HttpClient,
    private readonly origin: string,
  ) {
    super(httpClient);
  }

  async assert(alias: string): Promise<TAssertion> {
    return await this.httpClient.request<TAssertion>({
      method: 'GET',
      path: `/api/origins/${this.origin}/assert?alias=${alias}`,
    });
  }

  /**
   * Request the attestation challenge that starts registration — the
   * counterpart to `assert()`, which starts connecting to an existing
   * identity instead. Resolve the returned challenge and pass the result
   * as `register()`'s `assertionResult`.
   *
   * @param alias - Optional identity alias/identifier (e.g. a wallet
   * address for Ethereum origins). Omit for challenge types that don't
   * need one.
   */
  async attest(alias?: string): Promise<TAssertion> {
    return await this.httpClient.request<TAssertion>({
      method: 'GET',
      path: alias
        ? `/api/origins/${this.origin}/attest?alias=${alias}`
        : `/api/origins/${this.origin}/attest`,
    });
  }
}
