export interface KycVerificationParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the user
   * within the system.
   *
   * This value is used to associate the KYC verification process
   * with a specific user.
   *
   * @example "did:bloque:origin:..."
   */
  urn: string;
}

export interface KycVerificationResponse {
  /**
   * Current status of the verification
   */
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';

  /**
   * URL where the user can complete or view the verification
   */
  url: string;

  /**
   * Date when the verification was completed (ISO 8601 format)
   * null if verification is not yet completed
   */
  completedAt: string | null;
}

export interface GetKycVerificationParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the user
   * within the system.
   *
   * @example "did:bloque:user:123e4567"
   */
  urn: string;
}
