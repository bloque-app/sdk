import type { RequirementField } from '../tiers/types';

// Re-exported so `compliance.verificationGate.start()` and
// `compliance.tosGate.start()` share the exact same result shape (both
// gates' `/start` endpoints are wire-identical) without a duplicate
// declaration that `export *` from the package index would collide on.
export type { StartGateResult } from '../tos-gate/types';

export interface StartVerificationGateParams {
  /**
   * Where the hosted verification gate page redirects back to after
   * submission. Validated fail-closed against the union of two
   * allowlists: the calling origin's own
   * `metadata.verification_gate_return_url_allowlist` (if configured)
   * and the deployment-wide `VERIFICATION_GATE_RETURN_URL_ALLOWLIST` env
   * var. Either one being satisfied is enough — an origin with its own
   * list configured doesn't need every value re-registered centrally,
   * and one without its own list still falls back to the env var exactly
   * as before.
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
  /** Human-readable title for the requirement's card, distinct from
   * `description`. Falls back to a humanized version of `key` client-side
   * when absent. */
  title?: string;
  /** Only present for requirements that collect form answers. */
  fields?: RequirementField[];
  /**
   * Whether this requirement should collect a document upload. Already
   * accounts for the policy's `requiresUpload` opt-out server-side — it's
   * `false` for a `kind` that would otherwise default to uploadable but
   * is actually form-only (e.g. a one-off questionnaire `manual_review`
   * with no document to attach), so you don't need to hardcode which
   * `kind`s are uploadable yourself.
   */
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
  /** Human-readable title for the requirement's card, distinct from
   * `description`. Falls back to a humanized version of `key` client-side
   * when absent. */
  title?: string;
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
  /** The calling origin's `gate_accent_color` (a CSS hex color), if it has
   * one configured — see {@link TosGateInitResult.accentColor} for the
   * full explanation; both gates share the same origin-metadata source. */
  accentColor?: string;
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
