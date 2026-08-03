import { BaseClient } from '@bloque/sdk-core';
import type {
  StartGateResponse,
  TosAcceptanceRecordWire,
  TosGateAcceptRequest,
  TosGateAcceptResponse,
  TosGateInitResponse,
} from '../internal/wire-types';
import type {
  StartGateResult,
  StartTosGateParams,
  TosAcceptanceRecord,
  TosGateAcceptParams,
  TosGateAcceptResult,
  TosGateInitParams,
  TosGateInitResult,
} from './types';

function mapAcceptance(record: TosAcceptanceRecordWire): TosAcceptanceRecord {
  return {
    id: record.id,
    identityUrn: record.identity_urn,
    documentVersionId: record.document_version_id,
    documentVersionLabel: record.document_version_label,
    documentHash: record.document_hash,
    acceptedAt: record.accepted_at,
    authAssurance: record.auth_assurance,
  };
}

/**
 * Level 0 TOS gate (`/api/tos-gate/*`) — the hosted page a user opens to
 * accept the Terms of Service.
 *
 * `start()` authenticates as the SDK's connected session, same as any other
 * call. `init()`/`accept()` authenticate solely via the capability `token`
 * `start()` returns — the same bearer credential the hosted page itself
 * uses — so they work without a live session for that identity (this is
 * what makes the returned `url` portable to any browser).
 *
 * Usually you won't call these directly: catch a
 * `BloqueVerificationRequiredError` with `reason === 'tos'` and call its
 * `getVerificationLink()` instead, which calls `start()` for you.
 */
export class TosGateClient extends BaseClient {
  /**
   * Mint a portable TOS gate capability token + hosted page URL.
   *
   * @example
   * ```typescript
   * const gate = await bloque.compliance.tosGate.start({
   *   returnUrl: 'https://myapp.com/verification-complete',
   * });
   * // Open gate.url in a browser, or drive it programmatically with init()/accept().
   * ```
   */
  async start(params: StartTosGateParams): Promise<StartGateResult> {
    const response = await this.httpClient.request<StartGateResponse>({
      method: 'POST',
      path: '/api/tos-gate/start',
      body: { return_url: params.returnUrl },
    });
    return {
      token: response.token,
      url: response.url,
      expiresIn: response.expires_in,
    };
  }

  /**
   * Fetch the active TOS document for the token's identity and mint a
   * single-use acceptance nonce. Authorized solely by `params.token`.
   */
  async init(params: TosGateInitParams): Promise<TosGateInitResult> {
    const response = await this.httpClient.request<TosGateInitResponse>({
      method: 'GET',
      path: '/api/tos-gate/init',
      authorizationOverride: `Bearer ${params.token}`,
    });
    return {
      document: {
        documentVersionId: response.document.document_version_id,
        versionLabel: response.document.version_label,
        contentHash: response.document.content_hash,
        content: response.document.content,
      },
      csrfToken: response.csrf_token,
      returnUrl: response.return_url,
      showHome: response.show_home,
      accentColor: response.accent_color,
    };
  }

  /**
   * Record TOS acceptance for the token's identity. Authorized solely by
   * `params.token`; requires the single-use `csrfToken` from `init()`.
   */
  async accept(params: TosGateAcceptParams): Promise<TosGateAcceptResult> {
    const body: TosGateAcceptRequest = {
      csrf_token: params.csrfToken,
      ...(params.deviceAttestation && {
        device_attestation: params.deviceAttestation,
      }),
    };
    const response = await this.httpClient.request<
      TosGateAcceptResponse,
      TosGateAcceptRequest
    >({
      method: 'POST',
      path: '/api/tos-gate/accept',
      body,
      authorizationOverride: `Bearer ${params.token}`,
    });
    return {
      acceptance: mapAcceptance(response.acceptance),
      returnUrl: response.return_url,
    };
  }
}
