import type { HttpClient } from '@bloque/sdk-core';
import type {
  Origin,
  OTPAssertion,
  OTPAssertionEmail,
  OTPAssertionWhatsApp,
} from '../api-types';
import { OriginClient } from './origin';

export class OriginsClient {
  public readonly whatsapp: OriginClient<OTPAssertionWhatsApp>;
  public readonly email: OriginClient<OTPAssertionEmail>;

  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;

    this.whatsapp = new OriginClient(httpClient, 'bloque-whatsapp');
    this.email = new OriginClient(httpClient, 'bloque-email');
  }

  custom(origin: string): OriginClient<OTPAssertion> {
    return new OriginClient(this.httpClient, origin);
  }

  /**
   * List all available origins
   *
   * Retrieves a list of all registered origins with their current status.
   * Origins are the entry points for user identities and represent organizations,
   * startups, chains, or any entity that can hold a set of identities.
   *
   * @returns Promise resolving to an array of origins
   *
   * @example
   * ```typescript
   * const origins = await bloque.identity.origins.list();
   *
   * // Filter active origins
   * const activeOrigins = origins.filter(o => o.status === 'active');
   *
   * // Find specific provider origins
   * const evmOrigins = origins.filter(o => o.provider === 'evm');
   * ```
   */
  async list(): Promise<Origin[]> {
    const response = await this.httpClient.request<Origin[]>({
      method: 'GET',
      path: '/api/origins',
    });

    return response;
  }
}
