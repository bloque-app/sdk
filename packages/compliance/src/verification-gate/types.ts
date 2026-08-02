import type { RequirementField } from '../tiers/types';

// Re-exported so `compliance.verificationGate.start()` and
// `compliance.tosGate.start()` share the exact same result shape (both
// gates' `/start` endpoints are wire-identical) without a duplicate
// declaration that `export *` from the package index would collide on.
export type { StartGateResult } from '../tos-gate/types';

export interface StartVerificationGateParams {
  /**
   * Where the hosted verification gate page redirects back to after
   * submission. Must be present in the backend's
   * `VERIFICATION_GATE_RETURN_URL_ALLOWLIST` (enforced fail-closed).
   */
  returnUrl: string;
}

export interface VerificationGateInitParams {
  /** The capability token returned by `start()`. */
  token: string;
}

export interface VerificationUploadIntent {
  contentType: string;
  /** The S3 key to confirm in `submit()` once the PUT completes. */
  key: string;
  /** Presigned URL for a direct browser `PUT` upload. */
  uploadUrl: string;
  maxSizeBytes: number;
}

export interface VerificationRequirement {
  key: string;
  /** e.g. `'document'` or `'manual_review'` — TOS/KYC never appear here (they have no upload/form). */
  kind: string;
  description?: string;
  /** Only present for requirements that collect form answers. */
  fields?: RequirementField[];
  uploadable: boolean;
  /** One presigned upload URL per allowed content type, only when `uploadable`. */
  uploadIntents?: VerificationUploadIntent[];
}

/** A requirement already submitted and waiting on a reviewer. No fields
 * and no upload intents: there is nothing to collect, only something to
 * report. */
export interface PendingVerificationRequirement {
  key: string;
  description?: string;
  /** ISO-8601 timestamp of the submission. */
  submittedAt?: string;
}

export interface VerificationGateInitResult {
  /** Requirements the identity can still act on — unsatisfied, non-TOS/
   * KYC, and not already under review. */
  requirements: VerificationRequirement[];
  /** Requirements already submitted and awaiting review. Show these as in
   * progress; collecting them again would duplicate what a reviewer
   * already holds. */
  pendingRequirements: PendingVerificationRequirement[];
  /** Single-use submit nonce — pass as `csrfToken` to `submit()`. */
  csrfToken: string;
  returnUrl: string;
}

export interface SubmitDocumentConfirmation {
  requirementKey: string;
  /** The `key` from the `VerificationUploadIntent` used for the completed PUT. */
  s3Key: string;
  documentType?: string;
  side?: string;
  originalFilename?: string | null;
}

export interface SubmitFormAnswer {
  requirementKey: string;
  /** Answer values keyed by the requirement's `RequirementField.key`. */
  values: Record<string, unknown>;
}

export interface VerificationGateSubmitParams {
  /** The capability token returned by `start()`. */
  token: string;
  /** The single-use nonce from `init()`. */
  csrfToken: string;
  documents?: SubmitDocumentConfirmation[];
  answers?: SubmitFormAnswer[];
}

export interface VerificationGateSubmitResult {
  returnUrl: string;
  /**
   * Recording confirms the submission reached compliance — it does not
   * mean the requirement is now satisfied. A customer's own submission is
   * always recorded as `pending_review` and requires ops review before it
   * counts toward the identity's effective tier. Until then the identity
   * gets `E_VERIFICATION_PENDING` rather than being sent back here.
   */
  documents: unknown[];
  /** One evidence record per submitted requirement key — a requirement's
   * form answers and its uploaded files land in the same record. */
  answers: unknown[];
}
