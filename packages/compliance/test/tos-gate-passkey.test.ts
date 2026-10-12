import { afterEach, describe, expect, it, mock } from 'bun:test';
import { HttpClient } from '@bloque/sdk-core';
import {
  buildTosGatePasskeyCreationOptions,
  toAledgentPasskeyRegistration,
  toKreivoPasskeyRegistration,
  toTosGatePasskeyRegistration,
  type WebAuthnRegistrationCredential,
} from '../src/tos-gate/passkey';
import { TosGateClient } from '../src/tos-gate/tos-gate-client';
import type {
  TosGateAledgentPasskeyChallenge,
  TosGateKreivoPasskeyChallenge,
} from '../src/tos-gate/types';

const GATE_TOKEN = 'gate_capability_token';

function createClient(): TosGateClient {
  const http = new HttpClient({
    origin: 'colocapay',
    auth: { type: 'originKey', originKey: 'sk_dev_test_origin_key' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  return new TosGateClient(http);
}

interface Captured {
  url?: string;
  body?: unknown;
  authorization?: string | null;
}

function mockFetch(reply: unknown): Captured {
  const captured: Captured = {};
  globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
    captured.url = String(url);
    captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
    captured.authorization = new Headers(init?.headers).get('authorization');
    return Promise.resolve(
      new Response(JSON.stringify(reply), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }) as unknown as typeof fetch;
  return captured;
}

const ACCEPTANCE_WIRE = {
  id: 'acc_1',
  identity_urn: 'did:bloque:colocapay:alice',
  document_version_id: 'doc_v1',
  document_version_label: 'v1',
  document_hash: 'hash',
  accepted_at: '2026-10-12T00:00:00.000Z',
  auth_assurance: 'mfa',
};

/** Bytes 0..n-1, so base64url output is predictable. */
function seq(n: number, offset = 0): Uint8Array<ArrayBuffer> {
  return Uint8Array.from({ length: n }, (_, i) => (i + offset) & 0xff);
}

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function fakeCredential(): WebAuthnRegistrationCredential & {
  parts: Record<string, Uint8Array>;
} {
  const parts = {
    rawId: seq(16),
    clientDataJSON: new TextEncoder().encode(
      '{"type":"webauthn.create","challenge":"abc","origin":"https://bloque.app"}',
    ),
    attestationObject: seq(77, 3),
    authenticatorData: seq(37, 9),
    publicKey: seq(91, 5),
  };
  return {
    parts,
    rawId: parts.rawId.buffer as ArrayBuffer,
    response: {
      clientDataJSON: parts.clientDataJSON.buffer as ArrayBuffer,
      attestationObject: parts.attestationObject.buffer as ArrayBuffer,
      getAuthenticatorData: () => parts.authenticatorData.buffer as ArrayBuffer,
      getPublicKey: () => parts.publicKey.buffer as ArrayBuffer,
    },
  };
}

describe('TosGateClient.challenge()', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('tags the legacy (no scheme) challenge as kreivo', async () => {
    const captured = mockFetch({
      passkey: {
        challenge: 'Y2hhbGxlbmdl',
        context: 1234,
        expires_at_block: 1244,
        user_id: 'dXNlcg',
        user_name: 'did:bloque:colocapay:alice',
        public_address: '5Grw',
        rp_id: 'bloque.app',
      },
    });
    const { passkey } = await createClient().challenge({ token: GATE_TOKEN });
    expect(captured.url).toEndWith('/api/tos-gate/challenge');
    expect(captured.authorization).toBe(`Bearer ${GATE_TOKEN}`);
    expect(passkey).toEqual({
      scheme: 'kreivo',
      challenge: 'Y2hhbGxlbmdl',
      context: 1234,
      expiresAtBlock: 1244,
      userId: 'dXNlcg',
      userName: 'did:bloque:colocapay:alice',
      publicAddress: '5Grw',
      rpId: 'bloque.app',
    });
  });

  it('maps the aledgent challenge by its scheme', async () => {
    mockFetch({
      passkey: {
        scheme: 'aledgent',
        challenge: 'Y2hhbGxlbmdl',
        expires_at: 1760000000,
        rp_id: 'dev-bloque.app',
        user_id: 'dXNlcg',
        user_name: 'did:bloque:colocapay:alice',
      },
    });
    const { passkey } = await createClient().challenge({ token: GATE_TOKEN });
    expect(passkey).toEqual({
      scheme: 'aledgent',
      challenge: 'Y2hhbGxlbmdl',
      expiresAt: 1760000000,
      rpId: 'dev-bloque.app',
      userId: 'dXNlcg',
      userName: 'did:bloque:colocapay:alice',
    });
  });

  it('passes a null passkey through', async () => {
    mockFetch({ passkey: null });
    expect(await createClient().challenge({ token: GATE_TOKEN })).toEqual({
      passkey: null,
    });
  });

  it('refuses a scheme it cannot answer', async () => {
    mockFetch({ passkey: { scheme: 'other', challenge: 'x' } });
    await expect(
      createClient().challenge({ token: GATE_TOKEN }),
    ).rejects.toThrow('Unsupported TOS gate passkey scheme "other"');
  });
});

describe('TosGateClient.accept()', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends a kreivo registration unchanged (no scheme on the wire)', async () => {
    const captured = mockFetch({
      acceptance: {
        ...ACCEPTANCE_WIRE,
        account_activation: { attempted: true, state: 'active' },
      },
      return_url: 'https://myapp.com/done',
    });
    const result = await createClient().accept({
      token: GATE_TOKEN,
      csrfToken: 'csrf',
      // A pre-scheme caller: no `scheme` field at all.
      passkey: {
        credentialId: 'cred',
        authenticatorData: 'auth',
        clientData: 'client',
        publicKey: 'pk',
        context: 1234,
      },
    });
    expect(captured.url).toEndWith('/api/tos-gate/accept');
    expect(captured.authorization).toBe(`Bearer ${GATE_TOKEN}`);
    expect(captured.body).toEqual({
      csrf_token: 'csrf',
      passkey: {
        credential_id: 'cred',
        authenticator_data: 'auth',
        client_data: 'client',
        public_key: 'pk',
        context: 1234,
      },
    });
    expect(result.acceptance.accountActivation).toEqual({
      attempted: true,
      state: 'active',
      publicAddress: undefined,
      reason: undefined,
    });
    expect(result.passkeyRegistered).toBeUndefined();
  });

  it('keeps deviceAttestation precedence over a kreivo passkey', async () => {
    const captured = mockFetch({
      acceptance: ACCEPTANCE_WIRE,
      return_url: 'https://myapp.com/done',
    });
    await createClient().accept({
      token: GATE_TOKEN,
      csrfToken: 'csrf',
      deviceAttestation: '0x01',
      passkey: {
        scheme: 'kreivo',
        credentialId: 'cred',
        authenticatorData: 'auth',
        clientData: 'client',
        publicKey: 'pk',
        context: 1,
      },
    });
    expect(captured.body).toEqual({
      csrf_token: 'csrf',
      device_attestation: '0x01',
    });
  });

  it('sends exactly client_data_json + attestation_object for aledgent', async () => {
    const captured = mockFetch({
      acceptance: ACCEPTANCE_WIRE,
      return_url: 'https://myapp.com/done',
      passkey_registered: true,
    });
    const result = await createClient().accept({
      token: GATE_TOKEN,
      csrfToken: 'csrf',
      // Ignored on aledgent; never sent alongside an aledgent passkey.
      deviceAttestation: '0x01',
      passkey: {
        scheme: 'aledgent',
        clientDataJson: 'cdj',
        attestationObject: 'att',
        credentialId: 'cred',
      },
    });
    expect(captured.body).toEqual({
      csrf_token: 'csrf',
      passkey: { client_data_json: 'cdj', attestation_object: 'att' },
    });
    expect(result.passkeyRegistered).toBe(true);
    expect(result.acceptance.accountActivation).toBeUndefined();
  });

  it('surfaces passkey_registered: false', async () => {
    mockFetch({
      acceptance: ACCEPTANCE_WIRE,
      return_url: 'https://myapp.com/done',
      passkey_registered: false,
    });
    const result = await createClient().accept({
      token: GATE_TOKEN,
      csrfToken: 'csrf',
      passkey: {
        scheme: 'aledgent',
        clientDataJson: 'cdj',
        attestationObject: 'att',
      },
    });
    expect(result.passkeyRegistered).toBe(false);
  });
});

describe('passkey helpers', () => {
  const aledgentChallenge: TosGateAledgentPasskeyChallenge = {
    scheme: 'aledgent',
    challenge: b64url(seq(32)),
    expiresAt: 1760000000,
    rpId: 'bloque.app',
    userId: b64url(seq(32, 100)),
    userName: 'did:bloque:colocapay:alice',
  };
  const kreivoChallenge: TosGateKreivoPasskeyChallenge = {
    scheme: 'kreivo',
    challenge: b64url(seq(33)),
    context: 42,
    expiresAtBlock: 52,
    userId: b64url(seq(20, 7)),
    userName: 'did:bloque:colocapay:alice',
    publicAddress: '5Grw',
  };

  it('builds creation options like the hosted page', () => {
    const options = buildTosGatePasskeyCreationOptions(aledgentChallenge);
    expect(new Uint8Array(options.challenge)).toEqual(seq(32));
    expect(new Uint8Array(options.user.id)).toEqual(seq(32, 100));
    expect(options.rp).toEqual({ name: 'Bloque', id: 'bloque.app' });
    expect(options.user.name).toBe('did:bloque:colocapay:alice');
    expect(options.user.displayName).toBe('did:bloque:colocapay:alice');
    expect(options.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }]);
    expect(options.authenticatorSelection).toEqual({
      residentKey: 'required',
      userVerification: 'preferred',
    });
    expect(options.attestation).toBe('none');
    expect(options.timeout).toBe(120000);
  });

  it('omits rp.id on kreivo when the deployment sets none', () => {
    const options = buildTosGatePasskeyCreationOptions(kreivoChallenge, {
      rpName: 'Acme',
    });
    expect(options.rp).toEqual({ name: 'Acme' });
    expect(new Uint8Array(options.challenge)).toEqual(seq(33));
  });

  it('turns a credential into the aledgent registration (base64url)', () => {
    const credential = fakeCredential();
    expect(toAledgentPasskeyRegistration(credential)).toEqual({
      scheme: 'aledgent',
      clientDataJson: b64url(credential.parts.clientDataJSON as Uint8Array),
      attestationObject: b64url(
        credential.parts.attestationObject as Uint8Array,
      ),
      credentialId: b64url(credential.parts.rawId as Uint8Array),
    });
  });

  it('accepts typed-array views, honouring their offset', () => {
    const backing = seq(40);
    const view = new Uint8Array(backing.buffer, 5, 10);
    const registration = toAledgentPasskeyRegistration({
      rawId: view,
      response: { clientDataJSON: view, attestationObject: view },
    });
    expect(registration.attestationObject).toBe(b64url(seq(10, 5)));
  });

  it('refuses a credential without attestationObject', () => {
    expect(() =>
      toAledgentPasskeyRegistration({
        rawId: seq(4),
        response: { clientDataJSON: seq(4) },
      }),
    ).toThrow(TypeError);
  });

  it('turns a credential into the kreivo registration', () => {
    const credential = fakeCredential();
    expect(toKreivoPasskeyRegistration(credential, 42)).toEqual({
      scheme: 'kreivo',
      credentialId: b64url(credential.parts.rawId as Uint8Array),
      authenticatorData: b64url(
        credential.parts.authenticatorData as Uint8Array,
      ),
      clientData: b64url(credential.parts.clientDataJSON as Uint8Array),
      publicKey: b64url(credential.parts.publicKey as Uint8Array),
      context: 42,
    });
  });

  it('picks the scheme from the challenge', () => {
    const credential = fakeCredential();
    expect(
      toTosGatePasskeyRegistration(credential, aledgentChallenge).scheme,
    ).toBe('aledgent');
    const kreivo = toTosGatePasskeyRegistration(credential, kreivoChallenge);
    expect(kreivo.scheme).toBe('kreivo');
    expect(kreivo.scheme === 'kreivo' && kreivo.context).toBe(42);
  });

  it('round-trips every base64url tail length', () => {
    for (let n = 0; n < 8; n++) {
      const bytes = seq(n, 250);
      const encoded = toAledgentPasskeyRegistration({
        rawId: bytes,
        response: { clientDataJSON: bytes, attestationObject: bytes },
      }).attestationObject;
      expect(encoded).toBe(b64url(bytes));
      const options = buildTosGatePasskeyCreationOptions({
        ...aledgentChallenge,
        challenge: encoded,
      });
      expect(new Uint8Array(options.challenge)).toEqual(bytes);
    }
  });
});
