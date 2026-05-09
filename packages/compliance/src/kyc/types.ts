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

  /**
   * URL where webhook notifications will be sent when the verification
   * status changes.
   *
   * This is optional. If provided, the platform will send POST requests
   * to this URL with verification status updates.
   *
   * @example "https://api.example.com/webhooks/kyc"
   */
  webhookUrl?: string;
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

  /**
   * Documents download status (when document retrieval is enabled server-side).
   *
   * Values vary by provider; common values are "complete", "partial", "failed".
   */
  documentsStatus?: string;

  /**
   * Provider-specific verification payload (when available).
   */
  result?: unknown;
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

export interface GetKycDocumentsParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the user
   * within the system.
   */
  urn: string;
}

export interface KycDocumentImage {
  documentType: string;
  side: string;
  imageBase64: string;
  imageSizeBytes: number;
}

export interface KycDocumentsResponse {
  documentsStatus: string;
  documents: KycDocumentImage[];
}
