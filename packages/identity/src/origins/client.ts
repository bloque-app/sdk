import type { HttpClient } from '@bloque/sdk-core';
import type {
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
}
