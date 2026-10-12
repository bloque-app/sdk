import type {
  TosGateAledgentPasskeyRegistration,
  TosGateKreivoPasskeyRegistration,
  TosGatePasskeyChallenge,
  TosGatePasskeyRegistration,
} from './types';

/**
 * Browser-side helpers for the TOS gate's passkey step, for callers that
 * drive `tosGate.challenge()`/`accept()` themselves instead of opening the
 * hosted page. They mirror what the hosted page does, so a passkey made here
 * is the same as one made there.
 *
 * Typed structurally (no DOM lib needed): a real `PublicKeyCredential` from
 * `navigator.credentials.create()` satisfies {@link WebAuthnRegistrationCredential}.
 */

type Bytes = ArrayBuffer | ArrayBufferView;

/**
 * The parts of a `PublicKeyCredential` (from `navigator.credentials.create()`)
 * the helpers read. Pass the credential itself.
 */
export interface WebAuthnRegistrationCredential {
  rawId: Bytes;
  response: {
    clientDataJSON: Bytes;
    /** `AuthenticatorAttestationResponse.attestationObject`. */
    attestationObject?: Bytes;
    getAuthenticatorData?: () => Bytes;
    getPublicKey?: () => Bytes | null;
  };
}

/**
 * `PublicKeyCredentialCreationOptions` for a TOS gate passkey challenge,
 * assignable to the DOM type: pass it as
 * `navigator.credentials.create({ publicKey: options })`.
 */
export interface TosGatePasskeyCreationOptions {
  challenge: ArrayBuffer;
  rp: { name: string; id?: string };
  user: { id: ArrayBuffer; name: string; displayName: string };
  pubKeyCredParams: { type: 'public-key'; alg: number }[];
  authenticatorSelection: {
    residentKey: 'required';
    userVerification: 'preferred';
  };
  timeout: number;
  attestation: 'none';
}

export interface BuildTosGatePasskeyCreationOptionsParams {
  /** `rp.name` shown by the authenticator. Defaults to `"Bloque"`. */
  rpName?: string;
  /** Milliseconds. Defaults to 120000, as the hosted page. */
  timeout?: number;
}

const B64URL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function toUint8Array(bytes: Bytes): Uint8Array {
  if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** Unpadded base64url of `bytes`. Portable: no `Buffer`, no `btoa`. */
function base64UrlEncode(bytes: Bytes): string {
  const data = toUint8Array(bytes);
  let out = '';
  let i = 0;
  for (; i + 2 < data.length; i += 3) {
    const n =
      ((data[i] as number) << 16) |
      ((data[i + 1] as number) << 8) |
      (data[i + 2] as number);
    out +=
      B64URL[(n >> 18) & 63] +
      B64URL[(n >> 12) & 63] +
      B64URL[(n >> 6) & 63] +
      B64URL[n & 63];
  }
  const rest = data.length - i;
  if (rest === 1) {
    const n = (data[i] as number) << 16;
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63];
  } else if (rest === 2) {
    const n = ((data[i] as number) << 16) | ((data[i + 1] as number) << 8);
    out +=
      B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63];
  }
  return out;
}

/** Bytes of a base64url (or base64) string, padded or not. */
function base64UrlDecode(value: string): ArrayBuffer {
  const clean = value
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (clean.length % 4 === 1) {
    throw new TypeError('Invalid base64url string');
  }
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let bits = 0;
  let acc = 0;
  let j = 0;
  for (const char of clean) {
    const v = B64URL.indexOf(char);
    if (v < 0) throw new TypeError('Invalid base64url string');
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[j++] = (acc >> bits) & 0xff;
    }
  }
  return out.buffer;
}

/**
 * The `navigator.credentials.create()` options for a passkey challenge from
 * `tosGate.challenge()`, as the hosted page builds them: ES256 only, a
 * discoverable credential, no attestation.
 *
 * `rp.id` is the challenge's `rpId`. On `aledgent` it is always set and must
 * be used as is — ingress verifies against that exact value, not your page's
 * host. On `kreivo` it is set only if the deployment configures one;
 * otherwise it is omitted and the browser scopes the credential to your
 * page's origin.
 *
 * @example
 * ```typescript
 * const { passkey } = await bloque.compliance.tosGate.challenge({ token });
 * if (passkey) {
 *   const credential = await navigator.credentials.create({
 *     publicKey: buildTosGatePasskeyCreationOptions(passkey),
 *   });
 * }
 * ```
 */
export function buildTosGatePasskeyCreationOptions(
  challenge: TosGatePasskeyChallenge,
  params: BuildTosGatePasskeyCreationOptionsParams = {},
): TosGatePasskeyCreationOptions {
  const rpName = params.rpName ?? 'Bloque';
  return {
    challenge: base64UrlDecode(challenge.challenge),
    rp: challenge.rpId
      ? { name: rpName, id: challenge.rpId }
      : { name: rpName },
    user: {
      id: base64UrlDecode(challenge.userId),
      name: challenge.userName,
      displayName: challenge.userName,
    },
    // ES256 (-7): the only algorithm both Kreivo's pass pallet and aledgent
    // ingress verify; offering more would yield credentials they can't check.
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
    timeout: params.timeout ?? 120000,
    attestation: 'none',
  };
}

/**
 * Turns a `PublicKeyCredential` made against an `aledgent` challenge into
 * `accept()`'s `passkey`: base64url `clientDataJSON` and `attestationObject`,
 * which aledgent ingress verifies itself. `attestation: "none"` still yields
 * an `attestationObject`.
 *
 * @throws TypeError when the credential has no `attestationObject` (not a
 * registration response).
 */
export function toAledgentPasskeyRegistration(
  credential: WebAuthnRegistrationCredential,
): TosGateAledgentPasskeyRegistration {
  const { attestationObject, clientDataJSON } = credential.response;
  if (!attestationObject) {
    throw new TypeError(
      'credential.response has no attestationObject; pass the PublicKeyCredential returned by navigator.credentials.create()',
    );
  }
  return {
    scheme: 'aledgent',
    clientDataJson: base64UrlEncode(clientDataJSON),
    attestationObject: base64UrlEncode(attestationObject),
    credentialId: base64UrlEncode(credential.rawId),
  };
}

/**
 * Turns a `PublicKeyCredential` made against a `kreivo` challenge into
 * `accept()`'s `passkey`: its parts, plus the challenge's `context` echoed
 * back.
 *
 * @throws TypeError when the authenticator exposes no public key or
 * authenticator data (without the key the chain has nothing to verify
 * against later).
 */
export function toKreivoPasskeyRegistration(
  credential: WebAuthnRegistrationCredential,
  context: number,
): TosGateKreivoPasskeyRegistration {
  const { response } = credential;
  const publicKey = response.getPublicKey?.();
  const authenticatorData = response.getAuthenticatorData?.();
  if (!publicKey || !authenticatorData) {
    throw new TypeError(
      'credential.response exposes no public key or authenticator data; this authenticator cannot activate a Kreivo account',
    );
  }
  return {
    scheme: 'kreivo',
    credentialId: base64UrlEncode(credential.rawId),
    authenticatorData: base64UrlEncode(authenticatorData),
    clientData: base64UrlEncode(response.clientDataJSON),
    publicKey: base64UrlEncode(publicKey),
    context,
  };
}

/**
 * Turns a `PublicKeyCredential` into `accept()`'s `passkey`, in the scheme of
 * the challenge it answered — the one call a wallet needs when it supports
 * both backends.
 *
 * @example
 * ```typescript
 * const { passkey: challenge } = await bloque.compliance.tosGate.challenge({ token });
 * if (challenge) {
 *   const credential = await navigator.credentials.create({
 *     publicKey: buildTosGatePasskeyCreationOptions(challenge),
 *   });
 *   const { passkeyRegistered, acceptance } = await bloque.compliance.tosGate.accept({
 *     token,
 *     csrfToken,
 *     passkey: toTosGatePasskeyRegistration(credential as PublicKeyCredential, challenge),
 *   });
 * }
 * ```
 */
export function toTosGatePasskeyRegistration(
  credential: WebAuthnRegistrationCredential,
  challenge: TosGatePasskeyChallenge,
): TosGatePasskeyRegistration {
  return challenge.scheme === 'aledgent'
    ? toAledgentPasskeyRegistration(credential)
    : toKreivoPasskeyRegistration(credential, challenge.context);
}
