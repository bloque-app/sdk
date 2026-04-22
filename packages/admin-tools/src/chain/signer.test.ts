import { describe, expect, test } from 'bun:test';
import { DEV_PHRASE } from '@polkadot-labs/hdkd-helpers';
import { createControllerSigner, SignerError } from './signer.ts';

// Golden vectors derived from the well-known Substrate dev phrase
// (`bottom drive obey lake...`). Stable across polkadot tooling versions.
const ALICE_SS58_PREFIX_2 = 'HNZata7iMYWmk5RvZRTiAsSDhV8366zq2YGb3tLH5Upf74F';
const ALICE_SS58_PREFIX_42 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const CONTROLLER_0_SS58_PREFIX_2 =
  'GPcp18cjWGpmvWcg7gLJhFVZdDkJ61YoPdc7CbvG9WKW3Fu';

describe('createControllerSigner', () => {
  test('derives //Alice to a known SS58 address (prefix 2)', () => {
    const result = createControllerSigner({
      mnemonic: DEV_PHRASE,
      derivationPath: '//Alice',
      controllerAddress: ALICE_SS58_PREFIX_2,
    });
    expect(result.ss58Address).toBe(ALICE_SS58_PREFIX_2);
    expect(result.publicKey).toBeInstanceOf(Uint8Array);
    expect(result.publicKey.length).toBe(32);
    expect(typeof result.signer.signBytes).toBe('function');
    expect(typeof result.signer.signTx).toBe('function');
  });

  test('accepts an explicit ss58 prefix (e.g., 42 for generic Substrate)', () => {
    const result = createControllerSigner(
      {
        mnemonic: DEV_PHRASE,
        derivationPath: '//Alice',
        controllerAddress: ALICE_SS58_PREFIX_42,
      },
      42,
    );
    expect(result.ss58Address).toBe(ALICE_SS58_PREFIX_42);
  });

  test('derives nested paths like //Controller//0', () => {
    const result = createControllerSigner({
      mnemonic: DEV_PHRASE,
      derivationPath: '//Controller//0',
      controllerAddress: CONTROLLER_0_SS58_PREFIX_2,
    });
    expect(result.ss58Address).toBe(CONTROLLER_0_SS58_PREFIX_2);
  });

  test('throws SignerError when the derived address does not match the configured one', () => {
    expect(() =>
      createControllerSigner({
        mnemonic: DEV_PHRASE,
        derivationPath: '//Alice',
        controllerAddress: 'HwrongAddressThatWillNeverMatch0000000000000000',
      }),
    ).toThrow(SignerError);
  });

  test('throws SignerError on an invalid mnemonic', () => {
    expect(() =>
      createControllerSigner({
        mnemonic: 'not a real mnemonic phrase at all just garbage words',
        derivationPath: '//Alice',
        controllerAddress: ALICE_SS58_PREFIX_2,
      }),
    ).toThrow(SignerError);
  });

  test('signer.sign produces a 64-byte sr25519 signature', async () => {
    const { signer } = createControllerSigner({
      mnemonic: DEV_PHRASE,
      derivationPath: '//Alice',
      controllerAddress: ALICE_SS58_PREFIX_2,
    });
    // PolkadotSigner exposes signBytes for arbitrary payloads
    const sig = await signer.signBytes(new Uint8Array([1, 2, 3, 4]));
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig.length).toBe(64);
  });
});
