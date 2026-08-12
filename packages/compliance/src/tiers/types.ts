export interface GetTierStatusParams {
  /**
   * URN (Uniform Resource Name) that uniquely identifies the identity
   * whose tier status is being read.
   *
   * @example "did:bloque:user:123e4567"
   */
  urn: string;
}

/** A display label in both languages the hosted gates render in. */
export interface LocalizedText {
  en: string;
  es: string;
}

/** A `select` field option with a stored `value` distinct from its
 * localized display `label`. See {@link RequirementField.options}. */
export interface RequirementFieldOption {
  value: string;
  label: LocalizedText;
}

export interface RequirementField {
  key: string;
  label: string;
  /** Short help text rendered under the label, clarifying what's being asked. */
  description?: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required?: boolean;
  /** Only meaningful for `type: 'select'`. Supports legacy plain strings
   * (rendered as-is, unlocalized — still emitted by older policy entries)
   * or `{ value, label: { en, es } }` for a display label localized
   * independently of the stored value. */
  options?: (string | RequirementFieldOption)[];
  /** Pins which side of a localized option's `label` to display,
   * overriding the caller's own locale/language detection. Set on fields
   * whose surrounding `label`/`description` are themselves authored in a
   * single fixed language rather than localized, so the option list
   * doesn't mix languages mid-form. Omit for a field whose label and
   * options should track the same per-visitor language. */
  locale?: 'en' | 'es';
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
  /** Human-readable title for the requirement's card, distinct from
   * `description`. Falls back to a humanized version of `key` client-side
   * when absent — older policy entries may not set it. */
  title?: string;
  /** Only present for requirements that collect form answers. */
  fields?: RequirementField[];
  /** When explicitly `false`, this requirement is form-only and must
   * never be treated as uploadable regardless of `kind` (e.g. a
   * form-only `manual_review` like a one-off questionnaire). Omitted or
   * `true` means the usual kind-based uploadable default applies. */
  requiresUpload?: boolean;
  /** ISO-8601 timestamp of the submission behind a `'pending_review'`
   * status, for a "submitted on X" line. */
  submittedAt?: string;
  /**
   * ISO-8601. Set only on the `tos` requirement, and only while it reads
   * `'satisfied'` because of a policy rollout `enforcement_starts_at`
   * window — not for prior-version `grace_period_days`, and not from other
   * requirement kinds. Use it to prompt "accept by X" even though
   * `missingRequirements` / `verificationFlow` are quiet for the window.
   */
  graceUntil?: string;
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
  /**
   * Earliest ISO-8601 instant this answer could change with no further
   * input (TOS rollout cutoff, or satisfied evidence reaching `expires_at`).
   * `null` / omitted when nothing time-driven is pending.
   */
  nextRecomputeAt?: string | null;
}
