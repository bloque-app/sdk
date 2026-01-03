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
  webhookUrl?: string;
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
}
