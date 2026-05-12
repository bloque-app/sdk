/**
 * @internal
 * Wire types for Compliance API communication (snake_case format)
 * These types represent the raw API request/response format
 * and should not be used directly by SDK consumers.
 */

/**
 * @internal
 * Accomplice type for compliance verification
 */
export type AccompliceType = 'person' | 'company';

/**
 * @internal
 * Start KYC verification request body
 */
export interface StartKycVerificationRequest {
  urn: string;
  type: 'kyc' | 'kyb';
  accompliceType: AccompliceType;
}

/**
 * @internal
 * Start KYC verification response
 */
export interface StartKycVerificationResponse {
  url: string;
  type: 'kyc' | 'kyb';
  level: 'basic';
  provider: 'AMLBOT';
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
}

/**
 * @internal
 * Get KYC verification response
 */
export interface GetKycVerificationResponse {
  type: 'kyc' | 'kyb';
  level: 'basic';
  provider: 'AMLBOT';
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
  verification_url: string;
  completed_at: string | null;
  result?: unknown;
  documents_status?: string;
}

/**
 * @internal
 * Document image returned by the documents endpoint.
 */
export interface ComplianceDocumentImage {
  document_type: string;
  side: string;
  image_base64: string;
  image_size_bytes: number;
}

/**
 * @internal
 * Get compliance documents response.
 */
export interface GetKycDocumentsResponse {
  documents_status: string;
  documents: ComplianceDocumentImage[];
}
