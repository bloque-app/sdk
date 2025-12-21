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
  url: string;
  status: 'awaiting_compliance_verification' | 'approved' | 'rejected';
}
