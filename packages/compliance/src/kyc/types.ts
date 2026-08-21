/** Compliance verification type — individual (KYC) or business (KYB). */
export type KycComplianceType = 'kyc' | 'kyb';

/** Who is being verified within the request. */
export type KycAccompliceType = 'person' | 'company';

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
   * Verification type to start.
   * @default "kyc"
   */
  type?: KycComplianceType;

  /**
   * Who is being verified.
   * @default "person"
   */
  accompliceType?: KycAccompliceType;

  /**
   * URL where webhook notifications will be sent when the verification
   * status changes.
   *
   * @deprecated Not sent to the API — verification status webhooks are
   * configured provider-side, not per-request. This field has no effect.
   */
  webhookUrl?: string;
}

export interface KycVerificationResponse {
  /**
   * Verification type used.
   */
  type: KycComplianceType;

  /**
   * Compliance level used.
   */
  level: 'basic';

  /**
   * Compliance provider handling this verification.
   */
  provider: 'AMLBOT' | 'SUMSUB';

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
  /** S3 key for the stored image, or `null` if storage failed. */
  imageS3Key: string | null;
  imageSizeBytes: number;
  /** Short-lived presigned download URL, or `null` if presigning failed
   * (e.g. no storage client configured) — never a hard failure. */
  downloadUrl: string | null;
}

export interface KycDocumentsResponse {
  documentsStatus: string;
  documents: KycDocumentImage[];
}
