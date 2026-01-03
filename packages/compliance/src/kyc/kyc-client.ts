import { BaseClient } from '@bloque/sdk-core';
import type {
  GetKycVerificationResponse,
  StartKycVerificationRequest,
  StartKycVerificationResponse,
} from '../internal/wire-types';
import type {
  GetKycVerificationParams,
  KycVerificationParams,
  KycVerificationResponse,
} from './types';

export class KycClient extends BaseClient {
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
        ...(params.webhookUrl && { webhookUrl: params.webhookUrl }),
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
