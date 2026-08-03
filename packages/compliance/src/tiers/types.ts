export interface GetTierStatusParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the identity
   * whose tier status is being read.
   *
   * @example "did:bloque:user:123e4567"
   */
  urn: string;
}

export interface RequirementField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required?: boolean;
  /** Only meaningful for `type: 'select'`. */
  options?: string[];
}

export interface TierRequirementStatus {
  key: string;
  /** e.g. `'tos'`, `'kyc'`, `'document'`, `'manual_review'`, `'provider_check'`. */
  kind: string;
  /** `'pending_review'` still blocks the level, but your user has already
   * submitted it — show it as in progress rather than asking again. */
  status:
    | 'satisfied'
    | 'not_satisfied'
    | 'expired'
    | 'revoked'
    | 'pending_review';
  /** What this requirement means, for display without hardcoding key strings. */
  description?: string;
  /** Only present for requirements that collect form answers. */
  fields?: RequirementField[];
  /** ISO-8601 timestamp of the submission behind a `'pending_review'`
   * status, for a "submitted on X" line. */
  submittedAt?: string;
}

export interface TierLevelStatus {
  level: number;
  name: string;
  satisfied: boolean;
  requirements: TierRequirementStatus[];
}

/**
 * Machine-readable pointer to the hosted gate that resolves the caller's
 * current verification gap. Feed `startEndpoint`/`method` into a direct
 * request, or just catch the `BloqueVerificationRequiredError` this maps
 * onto and call its `getVerificationLink()` instead.
 */
export interface VerificationFlowHandoff {
  type: 'tos_hosted_acceptance' | 'document_submission';
  method: 'POST';
  startEndpoint: string;
  responseUrlField: string;
}

export interface TierStatus {
  identityUrn: string;
  /** Highest contiguous satisfied level; -1 if even Level 0 is unsatisfied. */
  effectiveLevel: number;
  policyVersion: string;
  levels: TierLevelStatus[];
  /** The next level that isn't fully satisfied, if any. */
  nextLevel?: number;
  /** Requirement keys still outstanding at `nextLevel`, actionable or not. */
  missingRequirements: string[];
  /** The subset of `missingRequirements` already submitted and awaiting a
   * reviewer. When it covers all of them, `verificationFlow` is absent:
   * there is nothing left for your user to do. */
  pendingRequirements: string[];
  verificationFlow?: VerificationFlowHandoff;
}
