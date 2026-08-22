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
  type?: 'kyc' | 'kyb';
  accompliceType?: AccompliceType;
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

/* ------------------------------------------------------------------
 * Tier status (compliance.tiers) — GET /api/compliance/:urn/tier-status
 * ------------------------------------------------------------------ */

/**
 * @internal
 * A display label in both languages the hosted gates render in.
 */
export interface LocalizedTextWire {
  en: string;
  es: string;
}

/**
 * @internal
 * A `select` field option with a stored `value` distinct from its
 * localized display `label`.
 */
export interface RequirementFieldOptionWire {
  value: string;
  label: LocalizedTextWire;
}

/**
 * @internal
 * A form field a `document`/`manual_review` requirement may ask for.
 */
export interface RequirementFieldWire {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required?: boolean;
  /** Legacy plain strings still appear alongside the newer localized
   * option shape — both must be accepted. */
  options?: (string | RequirementFieldOptionWire)[];
  locale?: 'en' | 'es';
}

/**
 * @internal
 * Status of a single requirement within a tier level.
 */
export interface TierRequirementStatusWire {
  key: string;
  kind: string;
  status:
    | 'satisfied'
    | 'not_satisfied'
    | 'expired'
    | 'revoked'
    | 'pending_review';
  description?: string;
  title?: string;
  fields?: RequirementFieldWire[];
  requires_upload?: boolean;
  submitted_at?: string;
  /** Present only on `tos` while a rollout `enforcement_starts_at` window
   * is treating the requirement as satisfied. ISO-8601. */
  grace_until?: string;
}

/**
 * @internal
 * Status of a single tier level, including all of its requirements.
 */
export interface TierLevelStatusWire {
  level: number;
  name: string;
  satisfied: boolean;
  requirements: TierRequirementStatusWire[];
}

/**
 * @internal
 * Handoff pointing a client at the Level 0 TOS gate.
 */
export interface TosHostedAcceptanceFlowHandoffWire {
  type: 'tos_hosted_acceptance';
  method: 'POST';
  start_endpoint: string;
  response_url_field: string;
}

/**
 * @internal
 * Handoff pointing a client at the Phase 3 hosted verification gate.
 */
export interface DocumentSubmissionFlowHandoffWire {
  type: 'document_submission';
  method: 'POST';
  start_endpoint: string;
  response_url_field: string;
}

/**
 * @internal
 * Machine-readable handoff describing which hosted gate to open next.
 */
export type VerificationFlowHandoffWire =
  | TosHostedAcceptanceFlowHandoffWire
  | DocumentSubmissionFlowHandoffWire;

/**
 * @internal
 * `GET /api/compliance/:urn/tier-status` response.
 */
export interface GetTierStatusResponse {
  identity_urn: string;
  effective_level: number;
  policy_version: string;
  levels: TierLevelStatusWire[];
  next_level?: number;
  missing_requirements?: string[];
  pending_requirements?: string[];
  verification_flow?: VerificationFlowHandoffWire;
  /** Earliest ISO-8601 instant this answer could change with no further
   * input (e.g. TOS rollout cutoff). `null` when nothing time-driven is pending. */
  next_recompute_at?: string | null;
}

/* ------------------------------------------------------------------
 * Hosted gates (shared shape) — POST /api/{tos,verification}-gate/start
 * ------------------------------------------------------------------ */

/**
 * @internal
 * `POST /api/tos-gate/start` and `POST /api/verification-gate/start`
 * share this exact response shape.
 */
export interface StartGateResponse {
  token: string;
  url: string;
  expires_in: string;
}

/* ------------------------------------------------------------------
 * TOS gate (compliance.tosGate) — /api/tos-gate/{init,accept}
 * ------------------------------------------------------------------ */

/**
 * @internal
 * `GET /api/tos-gate/init` document payload.
 */
export interface TosGateDocumentWire {
  document_version_id: string;
  version_label: string;
  content_hash: string;
  content: string;
}

/**
 * @internal
 * WebAuthn registration challenge minted by ledger for a TOS document that
 * requires account activation. Present on `GET /api/tos-gate/init` only when
 * that document's `requires_account_activation` is set.
 */
export interface TosGatePasskeyChallengeWire {
  challenge: string;
  context: number;
  expires_at_block: number;
  user_id: string;
  user_name: string;
  public_address: string;
  /** Only present if the deployment has `TOS_GATE_WEBAUTHN_RP_ID` set. */
  rp_id?: string;
}

/**
 * @internal
 * `GET /api/tos-gate/init` response.
 */
export interface TosGateInitResponse {
  document: TosGateDocumentWire;
  csrf_token: string;
  return_url: string;
  show_home: boolean;
  accent_color?: string;
  /**
   * `null` when this document doesn't require account activation, or when
   * minting the challenge failed server-side (fails open).
   */
  passkey: TosGatePasskeyChallengeWire | null;
}

/**
 * @internal
 * Raw WebAuthn registration parts, as an alternative to `device_attestation`
 * for callers driving `init()`/`accept()` themselves instead of opening the
 * hosted page.
 */
export interface TosGatePasskeyRegistrationWire {
  credential_id: string;
  authenticator_data: string;
  client_data: string;
  public_key: string;
  context: number;
}

/**
 * @internal
 * `POST /api/tos-gate/accept` request body.
 */
export interface TosGateAcceptRequest {
  csrf_token: string;
  device_attestation?: string;
  passkey?: TosGatePasskeyRegistrationWire;
}

/**
 * @internal
 * Outcome of handing the identity's Kreivo PassAccount to the device that
 * supplied `device_attestation`/`passkey` on accept. Absent when no
 * attestation was supplied.
 */
export interface TosAccountActivationWire {
  attempted: boolean;
  state?: string;
  public_address?: string;
  reason?: string;
}

/**
 * @internal
 * Recorded TOS acceptance, as returned by `POST /api/tos-gate/accept`.
 */
export interface TosAcceptanceRecordWire {
  id: string;
  identity_urn: string;
  document_version_id: string;
  document_version_label: string;
  document_hash: string;
  accepted_at: string;
  auth_assurance: string;
  account_activation?: TosAccountActivationWire;
}

/**
 * @internal
 * `POST /api/tos-gate/accept` response.
 */
export interface TosGateAcceptResponse {
  acceptance: TosAcceptanceRecordWire;
  return_url: string;
}

/* ------------------------------------------------------------------
 * Verification gate (compliance.verificationGate) —
 * /api/verification-gate/{init,submit}
 * ------------------------------------------------------------------ */

/**
 * @internal
 * One presigned upload URL for a requirement, for a single content type.
 */
export interface VerificationUploadIntentWire {
  content_type: string;
  key: string;
  upload_url: string;
  max_size_bytes: number;
}

/**
 * @internal
 * One outstanding requirement, as surfaced by `GET /api/verification-gate/init`.
 */
export interface VerificationRequirementWire {
  key: string;
  kind: string;
  description?: string;
  title?: string;
  fields?: RequirementFieldWire[];
  uploadable: boolean;
  upload_intents?: VerificationUploadIntentWire[];
}

/**
 * @internal
 * `GET /api/verification-gate/init` response.
 */
export interface PendingVerificationRequirementWire {
  key: string;
  description?: string;
  title?: string;
  submitted_at?: string;
}

export interface VerificationGateInitResponse {
  requirements: VerificationRequirementWire[];
  pending_requirements?: PendingVerificationRequirementWire[];
  csrf_token: string;
  return_url: string;
  accent_color?: string;
}

/**
 * @internal
 * A single confirmed document upload in a submit request.
 */
export interface VerificationGateSubmitDocumentWire {
  requirement_key: string;
  s3_key: string;
  document_type?: string;
  side?: string;
  original_filename?: string | null;
}

/**
 * @internal
 * A single form answer in a submit request.
 */
export interface VerificationGateSubmitAnswerWire {
  requirement_key: string;
  values: Record<string, unknown>;
}

/**
 * @internal
 * `POST /api/verification-gate/submit` request body.
 */
export interface VerificationGateSubmitRequest {
  csrf_token: string;
  documents?: VerificationGateSubmitDocumentWire[];
  answers?: VerificationGateSubmitAnswerWire[];
}

/**
 * @internal
 * `POST /api/verification-gate/submit` response. `documents`/`answers` are
 * untyped provider-passthrough results — not consumed by the SDK today.
 */
export interface VerificationGateSubmitResponse {
  return_url: string;
  documents: unknown[];
  answers: unknown[];
}
