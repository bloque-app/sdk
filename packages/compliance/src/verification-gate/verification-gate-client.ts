import { BaseClient } from '@bloque/sdk-core';
import type {
  StartGateResponse,
  VerificationGateInitResponse,
  VerificationGateSubmitRequest,
  VerificationGateSubmitResponse,
  VerificationRequirementWire,
  VerificationUploadIntentWire,
} from '../internal/wire-types';
import { mapRequirementField } from '../tiers/tiers-client';
import type {
  StartGateResult,
  StartVerificationGateParams,
  SubmitDocumentConfirmation,
  SubmitFormAnswer,
  VerificationGateInitParams,
  VerificationGateInitResult,
  VerificationGateSubmitParams,
  VerificationGateSubmitResult,
  VerificationRequirement,
  VerificationUploadIntent,
} from './types';

function mapUploadIntent(
  intent: VerificationUploadIntentWire,
): VerificationUploadIntent {
  return {
    contentType: intent.content_type,
    key: intent.key,
    uploadUrl: intent.upload_url,
    maxSizeBytes: intent.max_size_bytes,
  };
}

function mapRequirement(
  requirement: VerificationRequirementWire,
): VerificationRequirement {
  return {
    key: requirement.key,
    kind: requirement.kind,
    description: requirement.description,
    title: requirement.title,
    fields: requirement.fields?.map(mapRequirementField),
    uploadable: requirement.uploadable,
    uploadIntents: requirement.upload_intents?.map(mapUploadIntent),
  };
}

function mapDocumentToWire(document: SubmitDocumentConfirmation) {
  return {
    requirement_key: document.requirementKey,
    s3_key: document.s3Key,
    document_type: document.documentType,
    side: document.side,
    original_filename: document.originalFilename,
  };
}

function mapAnswerToWire(answer: SubmitFormAnswer) {
  return {
    requirement_key: answer.requirementKey,
    values: answer.values,
  };
}

/**
 * Phase 3 hosted verification gate (`/api/verification-gate/*`) — the
 * single hosted page that collects both document uploads and form answers
 * for any outstanding Level 2+ (non-TOS/non-KYC) requirement.
 *
 * Same capability-token shape as {@link TosGateClient}: `start()` uses the
 * SDK's session auth, `init()`/`submit()` authenticate solely via the
 * capability `token`.
 *
 * Usually you won't call these directly: catch a
 * `BloqueVerificationRequiredError` with `reason === 'documents'` and call
 * its `getVerificationLink()` instead, which calls `start()` for you.
 *
 * A `BloqueVerificationPendingError` is the one case where you should not
 * open this gate at all — everything it would collect is already with a
 * reviewer.
 */
export class VerificationGateClient extends BaseClient {
  /**
   * Mint a portable verification gate capability token + hosted page URL.
   */
  async start(params: StartVerificationGateParams): Promise<StartGateResult> {
    const response = await this.httpClient.request<StartGateResponse>({
      method: 'POST',
      path: '/api/verification-gate/start',
      body: { return_url: params.returnUrl },
    });
    return {
      token: response.token,
      url: response.url,
      expiresIn: response.expires_in,
    };
  }

  /**
   * Fetch the token identity's actionable requirements — with
   * descriptions, form field definitions, and presigned upload URLs for
   * uploadable ones — plus anything already under review (reported
   * separately, never re-collected) and a single-use submit nonce.
   * Authorized solely by `params.token`.
   */
  async init(
    params: VerificationGateInitParams,
  ): Promise<VerificationGateInitResult> {
    const response =
      await this.httpClient.request<VerificationGateInitResponse>({
        method: 'GET',
        path: '/api/verification-gate/init',
        authorizationOverride: `Bearer ${params.token}`,
      });
    return {
      requirements: response.requirements.map(mapRequirement),
      pendingRequirements: (response.pending_requirements ?? []).map(
        (requirement) => ({
          key: requirement.key,
          description: requirement.description,
          title: requirement.title,
          submittedAt: requirement.submitted_at,
        }),
      ),
      csrfToken: response.csrf_token,
      returnUrl: response.return_url,
      developerName: response.developer_name,
      accentColor: response.accent_color,
    };
  }

  /**
   * Submit confirmed document uploads and/or form answers for the token's
   * identity. Authorized solely by `params.token`; requires the single-use
   * `csrfToken` from `init()`.
   *
   * Recording a submission does not satisfy the requirement — see
   * {@link VerificationGateSubmitResult.documents}.
   */
  async submit(
    params: VerificationGateSubmitParams,
  ): Promise<VerificationGateSubmitResult> {
    const body: VerificationGateSubmitRequest = {
      csrf_token: params.csrfToken,
      documents: params.documents?.map(mapDocumentToWire),
      answers: params.answers?.map(mapAnswerToWire),
    };
    const response = await this.httpClient.request<
      VerificationGateSubmitResponse,
      VerificationGateSubmitRequest
    >({
      method: 'POST',
      path: '/api/verification-gate/submit',
      body,
      authorizationOverride: `Bearer ${params.token}`,
    });
    return {
      returnUrl: response.return_url,
      documents: response.documents,
      answers: response.answers,
    };
  }
}
