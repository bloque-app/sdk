import { BaseClient } from '@bloque/sdk-core';
import type {
  GetTierStatusResponse,
  RequirementFieldWire,
  TierRequirementStatusWire,
  VerificationFlowHandoffWire,
} from '../internal/wire-types';
import type {
  GetTierStatusParams,
  RequirementField,
  TierRequirementStatus,
  TierStatus,
  VerificationFlowHandoff,
} from './types';

/** @internal Shared by verification-gate-client.ts, which surfaces the same field descriptors. */
export function mapRequirementField(
  field: RequirementFieldWire,
): RequirementField {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    options: field.options,
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
    fields: requirement.fields?.map(mapRequirementField),
    submittedAt: requirement.submitted_at,
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
    responseUrlField: flow.response_url_field,
  };
}

/**
 * Tier status client — the read side of the compliance engine's
 * verification-tier control plane.
 */
export class TiersClient extends BaseClient {
  /**
   * Get an identity's effective compliance tier, per-level requirement
   * status, and (if not fully verified) which requirements are missing and
   * which hosted gate resolves them.
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
    };
  }
}
