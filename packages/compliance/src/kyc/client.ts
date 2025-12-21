import type { HttpClient } from '@bloque/sdk-core';
import type {
  GetKycVerificationResponse,
  StartKycVerificationRequest,
  StartKycVerificationResponse,
} from '../api-types';
import type {
  GetKycVerificationParams,
  KycVerificationParams,
  KycVerificationResponse,
} from './types';

export class KycClient {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async startVerification(
    params: KycVerificationParams,
  ): Promise<KycVerificationResponse> {
    const response = await this.httpClient.request<
      StartKycVerificationResponse,
      StartKycVerificationRequest
    >({
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
      completedAt: null,
    };
  }

  async getVerification(
    params: GetKycVerificationParams,
  ): Promise<KycVerificationResponse> {
    const response = await this.httpClient.request<GetKycVerificationResponse>({
      method: 'GET',
      path: `/api/compliance/${params.urn}`,
    });
    return {
      status: response.status,
      url: response.verification_url,
      completedAt: response.completed_at,
    };
  }
}
