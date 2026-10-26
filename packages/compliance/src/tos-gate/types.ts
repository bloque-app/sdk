export interface StartTosGateParams {
  /**
   * Where the hosted TOS gate page redirects back to after acceptance.
   * Must be an https URL. When your origin has an allowlist
   * (`tos_gate_return_url_allowlist`, set by Bloque), its origin must be in
   * it; links to Bloque's identity portal always require one.
   */
  returnUrl: string;
}

export interface StartGateResult {
  /** Capability token — pass as `token` to `init()`/`accept()` (or `verificationGate.init/submit`). */
  token: string;
  /** Fully-qualified hosted page URL a browser should open. */
  url: string;
  /** Token lifetime, e.g. `"30m"`. */
  expiresIn: string;
}

export interface TosGateInitParams {
  /** The capability token returned by `start()`. */
  token: string;
}

export interface TosGateDocument {
  documentVersionId: string;
  versionLabel: string;
  contentHash: string;
  /** Rendered document content (Markdown-templated to HTML server-side). */
  content: string;
}

/**
 * Which ledger backend a passkey challenge (and the registration answering
 * it) belongs to.
 *
 * - `kreivo` — the legacy path: the passkey takes control of the identity's
 *   Kreivo PassAccount; the registration goes back as its parts
 *   (`credentialId`, `authenticatorData`, `clientData`, `publicKey`,
 *   `context`).
 * - `aledgent` — the passkey is added to the identity's aledgent credential
 *   set; the registration goes back whole (`clientDataJson`,
 *   `attestationObject`) and aledgent ingress verifies it.
 *
 * The backend decides, per deployment: read `scheme` off `challenge()`'s
 * `passkey` and answer in the same scheme. Never infer it from the
 * environment name.
 */
export type TosGatePasskeyScheme = 'kreivo' | 'aledgent';

/**
 * Legacy (Kreivo) WebAuthn passkey registration challenge for the
 * account-activation step. Build a `PublicKeyCredentialCreationOptions` from
 * this (see `buildTosGatePasskeyCreationOptions()`), call
 * `navigator.credentials.create()`, then pass the result to `accept()` as
 * `passkey`. Declining is fine — call `accept()` without it and the
 * acceptance still records; the account is simply left
 * registered-but-not-activated (recoverable later).
 */
export interface TosGateKreivoPasskeyChallenge {
  /** Discriminator. The backend sends no scheme for this shape; the SDK sets it. */
  scheme: 'kreivo';
  /** Base64url — becomes `publicKey.challenge`. */
  challenge: string;
  /** The chain block this challenge is bound to; pass back unchanged in `accept()`'s `passkey.context`. */
  context: number;
  /** Last block the challenge can still be answered at (advisory only — the chain enforces it). */
  expiresAtBlock: number;
  /** Base64url — becomes `publicKey.user.id`. */
  userId: string;
  /** Human-facing credential name, as the authenticator displays it. */
  userName: string;
  publicAddress: string;
  /** Relying Party ID for `navigator.credentials.create()`, if the deployment sets one. */
  rpId?: string;
}

/**
 * aledgent WebAuthn `register` challenge for the passkey step, bound to the
 * identity's aledgent identity. Build a `PublicKeyCredentialCreationOptions`
 * from this (see `buildTosGatePasskeyCreationOptions()`), call
 * `navigator.credentials.create()`, turn the result into a registration with
 * `toAledgentPasskeyRegistration()` and pass it to `accept()` as `passkey`.
 * Declining is fine — the acceptance records without it.
 */
export interface TosGateAledgentPasskeyChallenge {
  /** Discriminator, as the backend sends it. */
  scheme: 'aledgent';
  /** Base64url — becomes `publicKey.challenge`. */
  challenge: string;
  /** When the challenge expires, as aledgent ingress reports it (advisory — ingress enforces it). */
  expiresAt: number;
  /**
   * Relying Party ID the passkey must be created for — always set. Ingress
   * verifies against this exact value, so use it as `rp.id` rather than your
   * page's host.
   */
  rpId: string;
  /** Base64url — becomes `publicKey.user.id`. Stable per identity, no personal data. */
  userId: string;
  /** Human-facing credential name, as the authenticator displays it. */
  userName: string;
}

/**
 * WebAuthn passkey registration challenge returned by `challenge()` —
 * discriminated by `scheme`. Narrow on it before reading scheme-specific
 * fields (`context` only exists on `kreivo`, `expiresAt` only on `aledgent`).
 */
export type TosGatePasskeyChallenge =
  | TosGateKreivoPasskeyChallenge
  | TosGateAledgentPasskeyChallenge;

export interface TosGateInitResult {
  document: TosGateDocument;
  /** Single-use acceptance nonce — pass as `csrfToken` to `accept()`. */
  csrfToken: string;
  returnUrl: string;
  /** The calling origin's branding name, substituted into the rendered
   * document and shown in the hosted page's wordmark. `undefined` when the
   * origin has none configured. */
  developerName?: string;
  /** Whether the hosted page's intro screens should play before the document. */
  showHome: boolean;
  /** The calling origin's `gate_accent_color` (a CSS hex color), if it has
   * one configured — the same color the hosted page itself applies via
   * `--accent`. `undefined` when the origin has none configured or it
   * failed validation server-side (e.g. not a valid 3-/6-digit hex). Only
   * useful if you're building your own UI around the gate rather than
   * just opening `url` in a browser/webview. */
  accentColor?: string;
  /**
   * Whether this document requires an account-activation passkey step —
   * `init()` only tells you *whether* to ask, not the challenge itself: the
   * challenge is bound to a short block-hash window, so it's minted
   * separately, as late as possible, via `challenge()` (call that right
   * before the user commits, not at page load).
   */
  passkeyRequired: boolean;
}

export interface TosGateChallengeParams {
  /** The capability token returned by `start()`. */
  token: string;
}

export interface TosGateChallengeResult {
  /**
   * Passkey registration challenge, or `null` when the identity has no
   * account ready for a device (the gate then shows no passkey step).
   */
  passkey: TosGatePasskeyChallenge | null;
}

/**
 * Raw WebAuthn registration parts on the legacy (Kreivo) backend, as an
 * alternative to `deviceAttestation` on `accept()` — use this when you drive
 * `init()`/`accept()` yourself (rather than opening the hosted page) and ran
 * WebAuthn against a `kreivo` challenge. `toKreivoPasskeyRegistration()`
 * builds it from a `PublicKeyCredential`.
 */
export interface TosGateKreivoPasskeyRegistration {
  /**
   * Discriminator. Optional so registrations written before the aledgent
   * scheme existed keep compiling; absent means `kreivo`.
   */
  scheme?: 'kreivo';
  /** `PublicKeyCredential.rawId`, base64url. */
  credentialId: string;
  /** `response.getAuthenticatorData()`, base64url. */
  authenticatorData: string;
  /** `response.clientDataJSON`, base64url. */
  clientData: string;
  /** `response.getPublicKey()` (SPKI), base64url. */
  publicKey: string;
  /** The `context` from the `kreivo` challenge — echoed back unchanged. */
  context: number;
}

/**
 * The raw WebAuthn registration on the aledgent backend, answering an
 * `aledgent` challenge. aledgent ingress verifies it as is.
 * `toAledgentPasskeyRegistration()` builds it from a `PublicKeyCredential`.
 */
export interface TosGateAledgentPasskeyRegistration {
  /** Discriminator — required for this shape. */
  scheme: 'aledgent';
  /** `response.clientDataJSON`, base64url. */
  clientDataJson: string;
  /** `response.attestationObject`, base64url. */
  attestationObject: string;
  /**
   * `PublicKeyCredential.rawId`, base64url — for your own records only. It
   * is not sent: ingress reads the credential out of `attestationObject`.
   */
  credentialId?: string;
}

/**
 * A WebAuthn registration for `accept()`'s `passkey`, discriminated by
 * `scheme`. Answer in the scheme of the challenge it was made against.
 */
export type TosGatePasskeyRegistration =
  | TosGateKreivoPasskeyRegistration
  | TosGateAledgentPasskeyRegistration;

export interface TosGateAcceptParams {
  /** The capability token returned by `start()`. */
  token: string;
  /** The single-use nonce returned by `init()`. */
  csrfToken: string;
  /**
   * Optional Pass device attestation (0x-hex SCALE-encoded
   * `PassDeviceAttestation`). When present, accepting the terms also hands
   * control of the identity's Kreivo PassAccount to that device. Takes
   * precedence over `passkey` if both are set.
   */
  deviceAttestation?: string;
  /**
   * Alternative to `deviceAttestation` — the raw WebAuthn registration you
   * produced yourself against `challenge()`'s `passkey`, in that challenge's
   * `scheme`. On the aledgent backend this is the only passkey input
   * (`deviceAttestation` is ignored there).
   */
  passkey?: TosGatePasskeyRegistration;
}

/**
 * Outcome of handing the identity's Kreivo PassAccount to the device that
 * supplied `deviceAttestation`/`passkey` on `accept()`. Non-throwing: a
 * failed activation never invalidates the (legally meaningful) acceptance
 * record it's attached to — check `attempted`/`reason` and retry via
 * `accept()` again (or the account stays recoverable in its
 * registered-but-not-activated state).
 */
export interface TosAccountActivation {
  attempted: boolean;
  /** Provisioning state reported by ledger, when the call succeeded. */
  state?: string;
  publicAddress?: string;
  /** Why activation did not happen or did not succeed. */
  reason?: string;
}

export interface TosAcceptanceRecord {
  id: string;
  identityUrn: string;
  documentVersionId: string;
  documentVersionLabel: string;
  documentHash: string;
  acceptedAt: string;
  authAssurance: string;
  /** Present only when `accept()` was called with `deviceAttestation` or `passkey`. */
  accountActivation?: TosAccountActivation;
}

export interface TosGateAcceptResult {
  acceptance: TosAcceptanceRecord;
  returnUrl: string;
  /**
   * aledgent backend only, and only when `passkey` was sent: whether the
   * passkey was registered on the identity's aledgent identity. Non-throwing
   * — a failed registration never invalidates the acceptance, and the same
   * registration can be retried later. `undefined` on the legacy backend
   * (check `acceptance.accountActivation` there).
   */
  passkeyRegistered?: boolean;
}
