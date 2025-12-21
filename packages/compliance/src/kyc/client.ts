import type { HttpClient } from '@bloque/sdk-core';
import type { StartKycVerificationResponse } from '../api-types';
import type { KycVerificationParams, KycVerificationResponse } from './types';

export class KycClient {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async startVerification(
    params: KycVerificationParams,
  ): Promise<KycVerificationResponse> {
    const response =
      await this.httpClient.request<StartKycVerificationResponse>({
        method: 'POST',
        path: '/api/compliance',
        body: {
          urn: params.urn,
          type: 'kyc',
          accompliceType: 'person',
        },
      });
    return {
      url: response.url,
      status: response.status,
    };
  }
}
