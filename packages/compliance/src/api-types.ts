export type AccompliceType = 'person' | 'company';

export interface StartKycVerificationRequest {
  urn: string;
  type: 'kyc' | 'kyb';
  accompliceType: AccompliceType;
}

export interface StartKycVerificationResponse {
  url: string;
  type: 'kyc' | 'kyb';
  level: 'basic';
  provider: 'AMLBOT';
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
}
