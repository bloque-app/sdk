import { BaseClient } from '@bloque/sdk-core';
import type {
  StartGateResponse,
  TosAcceptanceRecordWire,
  TosGateAcceptRequest,
  TosGateAcceptResponse,
  TosGateChallengeResponse,
  TosGateInitResponse,
  TosGatePasskeyChallengeWire,
  TosGatePasskeyRegistrationWire,
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
  TosGatePasskeyRegistration,
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
 * Some TOS documents also ask for a passkey on the same request. When that
 * applies, `init()`'s `passkeyRequired` is `true` — the hosted page calls
 * `challenge()` itself, right before the user commits, and runs WebAuthn
 * against it automatically. Driving `init()`/`accept()` yourself means
 * calling `challenge()` the same way (as late as possible) and passing the
 * WebAuthn result as `accept()`'s `passkey`. Declining is fine — `accept()`
 * without it still records the acceptance.
 *
 * The passkey step comes in two schemes, chosen by the backend and named by
 * the challenge's `scheme` (never by environment):
 * - `kreivo` (legacy): the passkey takes control of the identity's Kreivo
 *   PassAccount; answer with the registration's parts (or a finished
 *   `deviceAttestation`).
 * - `aledgent`: the passkey joins the identity's aledgent credential set;
 *   answer with the whole registration (`clientDataJson`,
 *   `attestationObject`).
 * `toTosGatePasskeyRegistration(credential, challenge)` answers in the right
 * one.
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
   * rather than at page load — the challenge expires (on `kreivo` it is
   * bound to a short block-hash window), so minting it early spends that
   * window on however long the user takes to read the document.
   *
   * The result's `passkey.scheme` says which backend minted it (`kreivo` or
   * `aledgent`); answer `accept()` in the same scheme.
   *
   * Only call this when `init()`'s `passkeyRequired` was `true`.
   *
   * @example
   * ```typescript
   * const { passkey } = await bloque.compliance.tosGate.challenge({ token: gate.token });
   * if (passkey) {
   *   const credential = await navigator.credentials.create({
   *     publicKey: buildTosGatePasskeyCreationOptions(passkey),
   *   });
   *   // then accept({ ..., passkey: toTosGatePasskeyRegistration(credential, passkey) })
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
   * // With a passkey, after running WebAuthn against challenge()'s `passkey`
   * const result = await bloque.compliance.tosGate.accept({
   *   token: gate.token,
   *   csrfToken,
   *   passkey: toTosGatePasskeyRegistration(credential, challenge),
   * });
   * // kreivo: result.acceptance.accountActivation?.attempted
   * // aledgent: result.passkeyRegistered
   * ```
   */
  async accept(params: TosGateAcceptParams): Promise<TosGateAcceptResult> {
    const aledgentPasskey = params.passkey?.scheme === 'aledgent';
    // An aledgent registration is always sent (that backend ignores
    // device_attestation). On kreivo, a finished deviceAttestation takes
    // precedence over the parts, as before.
    const sendDeviceAttestation =
      !!params.deviceAttestation && !aledgentPasskey;
    const body: TosGateAcceptRequest = {
      csrf_token: params.csrfToken,
      ...(sendDeviceAttestation && {
        device_attestation: params.deviceAttestation,
      }),
      ...(!sendDeviceAttestation &&
        params.passkey && {
          passkey: this._mapPasskeyRegistration(params.passkey),
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
      ...(typeof response.passkey_registered === 'boolean' && {
        passkeyRegistered: response.passkey_registered,
      }),
    };
  }

  /** @internal */
  private _mapPasskeyRegistration(
    passkey: TosGatePasskeyRegistration,
  ): TosGatePasskeyRegistrationWire {
    if (passkey.scheme === 'aledgent') {
      // Exactly what aledgent ingress verifies: no scheme, no credential id.
      return {
        client_data_json: passkey.clientDataJson,
        attestation_object: passkey.attestationObject,
      };
    }
    return {
      credential_id: passkey.credentialId,
      authenticator_data: passkey.authenticatorData,
      client_data: passkey.clientData,
      public_key: passkey.publicKey,
      context: passkey.context,
    };
  }

  /** @internal */
  private _mapPasskeyChallenge(
    challenge: TosGatePasskeyChallengeWire,
  ): TosGatePasskeyChallenge {
    if (challenge.scheme === 'aledgent') {
      return {
        scheme: 'aledgent',
        challenge: challenge.challenge,
        expiresAt: challenge.expires_at,
        rpId: challenge.rp_id,
        userId: challenge.user_id,
        userName: challenge.user_name,
      };
    }
    const scheme: unknown = (challenge as { scheme?: unknown }).scheme;
    if (scheme !== undefined) {
      // A scheme this SDK version cannot answer. Failing loudly beats
      // answering in the wrong shape; accept() without a passkey still works.
      throw new Error(
        `Unsupported TOS gate passkey scheme "${String(scheme)}"; upgrade @bloque/sdk-compliance`,
      );
    }
    return {
      scheme: 'kreivo',
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
