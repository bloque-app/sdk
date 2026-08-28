import { BaseClient } from '@bloque/sdk-core';
import type {
  GetTierStatusResponse,
  RequirementFieldOptionWire,
  RequirementFieldWire,
  TierRequirementStatusWire,
  TierStatusLimitsWire,
  VerificationFlowHandoffWire,
} from '../internal/wire-types';
import type {
  GetTierStatusParams,
  RequirementField,
  RequirementFieldOption,
  TierRequirementStatus,
  TierStatus,
  TierStatusLimits,
  VerificationFlowHandoff,
} from './types';

/** @internal Shared by tiers-client.ts and verification-gate-client.ts's
 * field-option mapping — a plain string passes through unlocalized. */
function mapRequirementFieldOption(
  option: string | RequirementFieldOptionWire,
): string | RequirementFieldOption {
  if (typeof option === 'string') return option;
  return {
    value: option.value,
    label: { en: option.label.en, es: option.label.es },
  };
}

/** @internal Shared by verification-gate-client.ts, which surfaces the same field descriptors. */
export function mapRequirementField(
  field: RequirementFieldWire,
): RequirementField {
  return {
    key: field.key,
    label: field.label,
    description: field.description,
    type: field.type,
    required: field.required,
    options: field.options?.map(mapRequirementFieldOption),
    locale: field.locale,
  };
}

function mapRequirementStatus(
  requirement: TierRequirementStatusWire,
): TierRequirementStatus {
  return {
    key: requirement.key,
    kind: requirement.kind,
    status: requirement.status,
    description: requirement.description,
    title: requirement.title,
    fields: requirement.fields?.map(mapRequirementField),
    requiresUpload: requirement.requires_upload,
    submittedAt: requirement.submitted_at,
    graceUntil: requirement.grace_until,
  };
}

function mapLimits(limits: TierStatusLimitsWire | undefined): TierStatusLimits {
  if (!limits) return { windows: [] };
  return {
    maxPerTransactionUsdMinorUnits: limits.max_per_transaction_usd_minor_units,
    windows: limits.windows.map((w) => ({
      windowType: w.window_type,
      windowKey: w.window_key,
      limitUsdMinorUnits: w.limit_usd_minor_units,
      consumedUsdMinorUnits: w.consumed_usd_minor_units,
      remainingUsdMinorUnits: w.remaining_usd_minor_units,
      resetAt: w.reset_at,
    })),
  };
}

/** @internal Shared by verification-gate-client.ts's start()/init() responses. */
export function mapVerificationFlow(
  flow: VerificationFlowHandoffWire | undefined,
): VerificationFlowHandoff | undefined {
  if (!flow) return undefined;
  return {
    type: flow.type,
    method: flow.method,
    startEndpoint: flow.start_endpoint,
    requestBody: {
      required: flow.request_body.required,
      optional: flow.request_body.optional,
      returnUrlPolicy: flow.request_body.return_url_policy,
    },
    responseUrlField: flow.response_url_field,
    transactionalRedirect: flow.transactional_redirect,
  };
}

/**
 * Tier status client — the read side of the compliance engine's
 * verification-tier control plane.
 */
export class TiersClient extends BaseClient {
  /**
   * Get an identity's effective compliance tier, per-level requirement
   * status, live money-limit usage, and (if not fully verified) which
   * requirements are missing and which hosted gate resolves them.
   *
   * @example
   * ```typescript
   * const status = await bloque.compliance.tiers.getStatus({ urn: user.urn });
   * if (status.verificationFlow?.type === 'tos_hosted_acceptance') {
   *   // caller needs to accept TOS — see compliance.tosGate
   * }
   * ```
   */
  async getStatus(params: GetTierStatusParams): Promise<TierStatus> {
    const response = await this.httpClient.request<GetTierStatusResponse>({
      method: 'GET',
      path: `/api/compliance/${params.urn}/tier-status`,
    });

    return {
      identityUrn: response.identity_urn,
      effectiveLevel: response.effective_level,
      policyVersion: response.policy_version,
      levels: response.levels.map((level) => ({
        level: level.level,
        name: level.name,
        satisfied: level.satisfied,
        requirements: level.requirements.map(mapRequirementStatus),
      })),
      nextLevel: response.next_level,
      missingRequirements: response.missing_requirements ?? [],
      pendingRequirements: response.pending_requirements ?? [],
      verificationFlow: mapVerificationFlow(response.verification_flow),
      nextRecomputeAt: response.next_recompute_at,
      limits: mapLimits(response.limits),
    };
  }
}
