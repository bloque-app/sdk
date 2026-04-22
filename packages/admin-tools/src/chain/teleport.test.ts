import { describe, expect, test } from 'bun:test';
import {
  ASSET_HUB_PARA_ID,
  KREIVO_PARA_ID,
  createTeleportTx,
} from './teleport.ts';

// SS58 of //Alice on the generic Substrate prefix (42).
const ALICE_SS58 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const ALICE_HEX_ID =
  '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';

const NATIVE_KSM_LOCATION = {
  parents: 1,
  interior: { type: 'Here', value: undefined },
};

function createMockApi() {
  let xcmArgs: any;
  let xcmDecodedCall: unknown;
  const proxyArgs: unknown[] = [];

  const xcmTx = { decodedCall: { tag: 'xcm-call' } };
  const finalTx = { decodedCall: { tag: 'proxy-call' } };

  const api = {
    tx: {
      PolkadotXcm: {
        transfer_assets_using_type_and_then(args: any) {
          xcmArgs = args;
          xcmDecodedCall = xcmTx.decodedCall;
          return xcmTx;
        },
      },
      Proxy: {
        proxy(args: unknown) {
          proxyArgs.push(args);
          return finalTx;
        },
      },
    },
  };

  return {
    api,
    finalTx,
    getXcmArgs: () => xcmArgs,
    getProxyArgs: () => proxyArgs,
    getXcmDecodedCall: () => xcmDecodedCall,
  };
}

describe('teleport', () => {
  test('kreivo->asset-hub uses DestinationReserve and dest paraId 1000', () => {
    const { api, finalTx, getXcmArgs, getProxyArgs } = createMockApi();

    const tx = createTeleportTx(
      api as any,
      {
        direction: 'kreivo->asset-hub',
        transferAsset: NATIVE_KSM_LOCATION,
        transferAmount: 1_000_000n,
        feeAmount: 100_000n,
        beneficiary: ALICE_SS58,
        real: '5Escrow',
      } as any,
    );

    const xcm = getXcmArgs();
    expect(xcm.assets_transfer_type).toEqual({
      type: 'DestinationReserve',
      value: undefined,
    });
    expect(xcm.fees_transfer_type).toEqual({
      type: 'DestinationReserve',
      value: undefined,
    });
    expect(xcm.dest.value.interior.value).toEqual({
      type: 'Parachain',
      value: ASSET_HUB_PARA_ID,
    });

    expect(getProxyArgs()).toEqual([
      { real: '5Escrow', call: { tag: 'xcm-call' } },
    ]);
    expect(tx).toBe(finalTx as any);
  });

  test('asset-hub->kreivo uses LocalReserve and dest paraId 2281', () => {
    const { api, getXcmArgs } = createMockApi();

    createTeleportTx(
      api as any,
      {
        direction: 'asset-hub->kreivo',
        transferAsset: NATIVE_KSM_LOCATION,
        transferAmount: 1n,
        feeAmount: 1n,
        beneficiary: ALICE_SS58,
        real: '5Escrow',
      } as any,
    );

    const xcm = getXcmArgs();
    expect(xcm.assets_transfer_type.type).toBe('LocalReserve');
    expect(xcm.fees_transfer_type.type).toBe('LocalReserve');
    expect(xcm.dest.value.interior.value).toEqual({
      type: 'Parachain',
      value: KREIVO_PARA_ID,
    });
  });

  test('merges amounts when transfer asset == fee asset (single asset entry)', () => {
    const { api, getXcmArgs } = createMockApi();

    createTeleportTx(
      api as any,
      {
        direction: 'kreivo->asset-hub',
        transferAsset: NATIVE_KSM_LOCATION,
        transferAmount: 1_000n,
        feeAmount: 5n,
        beneficiary: ALICE_SS58,
        real: '5Escrow',
      } as any,
    );

    const assets = getXcmArgs().assets.value;
    expect(assets.length).toBe(1);
    expect(assets[0].fun).toEqual({ type: 'Fungible', value: 1_005n });
  });

  test('emits two asset entries (fee, transfer) when locations differ', () => {
    const { api, getXcmArgs } = createMockApi();

    const customAsset = {
      parents: 0,
      interior: {
        type: 'X2',
        value: [
          { type: 'PalletInstance', value: 50 },
          { type: 'GeneralIndex', value: 1984n },
        ],
      },
    };

    createTeleportTx(
      api as any,
      {
        direction: 'kreivo->asset-hub',
        transferAsset: customAsset,
        transferAmount: 1_000n,
        feeAmount: 5n,
        beneficiary: ALICE_SS58,
        real: '5Escrow',
      } as any,
    );

    const assets = getXcmArgs().assets.value;
    expect(assets.length).toBe(2);
    // Fee comes first per the rust crafter pattern.
    expect(assets[0].id).toEqual(NATIVE_KSM_LOCATION);
    expect(assets[0].fun).toEqual({ type: 'Fungible', value: 5n });
    expect(assets[1].id).toEqual(customAsset);
    expect(assets[1].fun).toEqual({ type: 'Fungible', value: 1_000n });
  });

  test('decodes the SS58 beneficiary into a 0x-prefixed AccountId32 hex', () => {
    const { api, getXcmArgs } = createMockApi();

    createTeleportTx(
      api as any,
      {
        direction: 'kreivo->asset-hub',
        transferAsset: NATIVE_KSM_LOCATION,
        transferAmount: 1n,
        feeAmount: 1n,
        beneficiary: ALICE_SS58,
        real: '5Escrow',
      } as any,
    );

    const depositInstruction = getXcmArgs().custom_xcm_on_dest.value[0];
    expect(depositInstruction.type).toBe('DepositAsset');
    expect(depositInstruction.value.beneficiary.interior.value).toEqual({
      type: 'AccountId32',
      value: { network: undefined, id: ALICE_HEX_ID },
    });
  });

  test('throws when the beneficiary SS58 does not decode to 32 bytes', () => {
    const { api } = createMockApi();
    expect(() =>
      createTeleportTx(
        api as any,
        {
          direction: 'kreivo->asset-hub',
          transferAsset: NATIVE_KSM_LOCATION,
          transferAmount: 1n,
          feeAmount: 1n,
          // Kusama-style ECDSA address (20-byte EVM-style) — not AccountId32.
          beneficiary: 'F7gh',
          real: '5Escrow',
        } as any,
      ),
    ).toThrow();
  });
});
