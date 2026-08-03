export interface StartTosGateParams {
  /**
   * Where the hosted TOS gate page redirects back to after acceptance.
   * Must be present in the backend's `TOS_GATE_RETURN_URL_ALLOWLIST`.
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

export interface TosGateInitResult {
  document: TosGateDocument;
  /** Single-use acceptance nonce — pass as `csrfToken` to `accept()`. */
  csrfToken: string;
  returnUrl: string;
  /** Whether the hosted page's intro screens should play before the document. */
  showHome: boolean;
  /** The calling origin's `gate_accent_color` (a CSS hex color), if it has
   * one configured — the same color the hosted page itself applies via
   * `--accent`. `undefined` when the origin has none configured or it
   * failed validation server-side (e.g. not a valid 3-/6-digit hex). Only
   * useful if you're building your own UI around the gate rather than
   * just opening `url` in a browser/webview. */
  accentColor?: string;
}

export interface TosGateAcceptParams {
  /** The capability token returned by `start()`. */
  token: string;
  /** The single-use nonce returned by `init()`. */
  csrfToken: string;
  /**
   * Optional Pass device attestation (0x-hex SCALE-encoded
   * `PassDeviceAttestation`). When present, accepting the terms also hands
   * control of the identity's Kreivo PassAccount to that device.
   */
  deviceAttestation?: string;
}

export interface TosAcceptanceRecord {
  id: string;
  identityUrn: string;
  documentVersionId: string;
  documentVersionLabel: string;
  documentHash: string;
  acceptedAt: string;
  authAssurance: string;
}

export interface TosGateAcceptResult {
  acceptance: TosAcceptanceRecord;
  returnUrl: string;
}
