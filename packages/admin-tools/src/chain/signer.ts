import { sr25519CreateDerive } from '@polkadot-labs/hdkd';
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
  ss58Address,
  validateMnemonic,
} from '@polkadot-labs/hdkd-helpers';
import { getPolkadotSigner, type PolkadotSigner } from 'polkadot-api/signer';
import type { AdminConfig } from '../config.ts';

export interface ControllerSigner {
  publicKey: Uint8Array;
  ss58Address: string;
  signer: PolkadotSigner;
}

export class SignerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignerError';
  }
}

// Kusama/Kreivo share prefix 2; Asset Hub (Kusama) also uses 2.
// SS58 address format is only informational here — signing is prefix-agnostic.
const DEFAULT_SS58_PREFIX = 2;

export function createControllerSigner(
  cfg: AdminConfig['chain']['signer'],
  ss58Prefix: number = DEFAULT_SS58_PREFIX,
): ControllerSigner {
  if (!validateMnemonic(cfg.mnemonic)) {
    throw new SignerError(
      'chain.signer.mnemonic is not a valid BIP-39 mnemonic',
    );
  }

  const miniSecret = entropyToMiniSecret(mnemonicToEntropy(cfg.mnemonic));
  const derive = sr25519CreateDerive(miniSecret);
  const keyPair = derive(cfg.derivationPath);

  const derivedAddress = ss58Address(keyPair.publicKey, ss58Prefix);
  if (derivedAddress !== cfg.controllerAddress) {
    throw new SignerError(
      `derived controller address ${derivedAddress} does not match configured chain.signer.controller_address ${cfg.controllerAddress}`,
    );
  }

  return {
    publicKey: keyPair.publicKey,
    ss58Address: derivedAddress,
    signer: getPolkadotSigner(keyPair.publicKey, 'Sr25519', keyPair.sign),
  };
}
