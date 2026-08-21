import { BaseClient } from '@bloque/sdk-core';
import type {
  GetKycDocumentsResponse,
  GetKycVerificationResponse,
  StartKycVerificationRequest,
  StartKycVerificationResponse,
} from '../internal/wire-types';
import type {
  GetKycDocumentsParams,
  GetKycVerificationParams,
  KycDocumentsResponse,
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
        type: params.type ?? 'kyc',
        accompliceType: params.accompliceType ?? 'person',
      },
    });
    return {
      type: response.type,
      level: response.level,
      provider: response.provider,
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
      type: response.type,
      level: response.level,
      provider: response.provider,
      status: response.status,
      url: response.verification_url,
      completedAt: response.completed_at,
      result: response.result,
      documentsStatus: response.documents_status,
    };
  }

  async getDocuments(
    params: GetKycDocumentsParams,
  ): Promise<KycDocumentsResponse> {
    const response = await this.httpClient.request<GetKycDocumentsResponse>({
      method: 'GET',
      path: `/api/compliance/${params.urn}/documents`,
    });

    return {
      documentsStatus: response.documents_status,
      documents: response.documents.map((doc) => ({
        documentType: doc.document_type,
        side: doc.side,
        imageS3Key: doc.image_s3_key,
        imageSizeBytes: doc.image_size_bytes,
        downloadUrl: doc.download_url,
      })),
    };
  }
}
