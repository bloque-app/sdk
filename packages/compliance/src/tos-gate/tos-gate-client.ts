import { BaseClient } from '@bloque/sdk-core';
import type {
  StartGateResponse,
  TosAcceptanceRecordWire,
  TosGateAcceptRequest,
  TosGateAcceptResponse,
  TosGateChallengeResponse,
  TosGateInitResponse,
  TosGatePasskeyChallengeWire,
} from '../internal/wire-types';
import type {
  StartGateResult,
  StartTosGateParams,
  TosAcceptanceRecord,
  TosGateAcceptParams,
  TosGateAcceptResult,
  TosGateChallengeParams,
  TosGateChallengeResult,
  TosGateInitParams,
  TosGateInitResult,
  TosGatePasskeyChallenge,
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
    ...(record.account_activation && {
      accountActivation: {
        attempted: record.account_activation.attempted,
        state: record.account_activation.state,
        publicAddress: record.account_activation.public_address,
        reason: record.account_activation.reason,
      },
    }),
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
 *
 * Some TOS documents also require handing the identity's Kreivo PassAccount
 * to a passkey on the same request (account activation). When that applies,
 * `init()`'s `passkeyRequired` is `true` — the hosted page calls
 * `challenge()` itself, right before the user commits, and runs WebAuthn
 * against it automatically. Driving `init()`/`accept()` yourself means
 * calling `challenge()` the same way (as late as possible — its challenge is
 * bound to a short block-hash window) and passing the WebAuthn result as
 * `accept()`'s `passkey` (or a finished `deviceAttestation`). Declining is
 * fine — `accept()` without either still records the acceptance.
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
   *
   * @example
   * ```typescript
   * const { document, csrfToken, passkeyRequired } = await bloque.compliance.tosGate.init({
   *   token: gate.token,
   * });
   *
   * if (passkeyRequired) {
   *   // This document requires account activation. Call challenge() right
   *   // before the user commits, run WebAuthn against it, then pass the
   *   // result to accept() as `passkey`.
   * }
   * ```
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
      developerName: response.developer_name,
      showHome: response.show_home,
      accentColor: response.accent_color,
      passkeyRequired: response.passkey_required,
    };
  }

  /**
   * Mint the WebAuthn registration challenge for the token's identity.
   * Separate from `init()`, and call it right before the user commits
   * rather than at page load — the challenge is bound to a short
   * block-hash window, so minting it early spends that window on however
   * long the user takes to read the document.
   *
   * Only call this when `init()`'s `passkeyRequired` was `true`.
   *
   * @example
   * ```typescript
   * const { passkey } = await bloque.compliance.tosGate.challenge({ token: gate.token });
   * if (passkey) {
   *   // Build a PublicKeyCredentialCreationOptions from `passkey` and call
   *   // navigator.credentials.create(), then pass the result to accept().
   * }
   * ```
   */
  async challenge(
    params: TosGateChallengeParams,
  ): Promise<TosGateChallengeResult> {
    const response = await this.httpClient.request<TosGateChallengeResponse>({
      method: 'GET',
      path: '/api/tos-gate/challenge',
      authorizationOverride: `Bearer ${params.token}`,
    });
    return {
      passkey: response.passkey
        ? this._mapPasskeyChallenge(response.passkey)
        : null,
    };
  }

  /**
   * Record TOS acceptance for the token's identity. Authorized solely by
   * `params.token`; requires the single-use `csrfToken` from `init()`.
   *
   * @example
   * ```typescript
   * // Plain acceptance, no activation step
   * await bloque.compliance.tosGate.accept({ token: gate.token, csrfToken });
   *
   * // With account activation, after running WebAuthn against init().passkey
   * const { acceptance } = await bloque.compliance.tosGate.accept({
   *   token: gate.token,
   *   csrfToken,
   *   passkey: {
   *     credentialId,
   *     authenticatorData,
   *     clientData,
   *     publicKey,
   *     context: passkey.context,
   *   },
   * });
   * console.log(acceptance.accountActivation?.attempted);
   * ```
   */
  async accept(params: TosGateAcceptParams): Promise<TosGateAcceptResult> {
    const body: TosGateAcceptRequest = {
      csrf_token: params.csrfToken,
      ...(params.deviceAttestation && {
        device_attestation: params.deviceAttestation,
      }),
      ...(!params.deviceAttestation &&
        params.passkey && {
          passkey: {
            credential_id: params.passkey.credentialId,
            authenticator_data: params.passkey.authenticatorData,
            client_data: params.passkey.clientData,
            public_key: params.passkey.publicKey,
            context: params.passkey.context,
          },
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

  /** @internal */
  private _mapPasskeyChallenge(
    challenge: TosGatePasskeyChallengeWire,
  ): TosGatePasskeyChallenge {
    return {
      challenge: challenge.challenge,
      context: challenge.context,
      expiresAtBlock: challenge.expires_at_block,
      userId: challenge.user_id,
      userName: challenge.user_name,
      publicAddress: challenge.public_address,
      rpId: challenge.rp_id,
    };
  }
}
