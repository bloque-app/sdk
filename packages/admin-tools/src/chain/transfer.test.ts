import { describe, expect, test } from 'bun:test';
import { InvalidTxError } from 'polkadot-api';
import type { PolkadotSigner } from 'polkadot-api/signer';
import { createTransferTx, executeTransfer } from './transfer.ts';

type Observer = {
  next?: (value: any) => void;
  error?: (error: unknown) => void;
  complete?: () => void;
};

function createMockSigner(): PolkadotSigner {
  return {
    publicKey: new Uint8Array(32),
    type: 'Sr25519',
    signBytes: async () => new Uint8Array(64),
    signTx: async () => ({ signature: new Uint8Array(64) }),
  } as unknown as PolkadotSigner;
}

function createWatchableTx(emissions: Array<any>, onUnsubscribe?: () => void) {
  return {
    subscribe(observer: Observer) {
      for (const emission of emissions) {
        if (emission?.kind === 'error') {
          observer.error?.(emission.error);
          return { unsubscribe: onUnsubscribe ?? (() => undefined) };
        }

        observer.next?.(emission);
      }

      return { unsubscribe: onUnsubscribe ?? (() => undefined) };
    },
  };
}

function createMockApi(
  finalTx: {
    decodedCall: unknown;
    signSubmitAndWatch: (signer: PolkadotSigner) => {
      subscribe: (observer: Observer) => { unsubscribe: () => void };
    };
  },
  proxyTxs: Array<{ decodedCall: unknown }> = [],
) {
  const proxyArgs: unknown[] = [];
  let assetArgs: unknown;
  const proxyCalls = [...proxyTxs, finalTx];

  const api = {
    tx: {
      Assets: {
        transfer(args: unknown) {
          assetArgs = args;
          return { decodedCall: { tag: 'asset-transfer' } };
        },
      },
      Proxy: {
        proxy(args: unknown) {
          proxyArgs.push(args);
          return proxyCalls.shift() ?? finalTx;
        },
      },
    },
  };

  return {
    api,
    getAssetArgs: () => assetArgs,
    getProxyArgs: () => proxyArgs,
  };
}

describe('transfer', () => {
  test('builds an escrow transfer as a single proxy-wrapped assets transfer', async () => {
    let unsubscribed = false;
    const signer = createMockSigner();
    const finalTx = {
      decodedCall: { type: 'Mock', value: 'final-transfer' },
      signSubmitAndWatch(submittedSigner: PolkadotSigner) {
        expect(submittedSigner).toBe(signer);
        return createWatchableTx(
          [
            { type: 'signed' },
            {
              type: 'txBestBlocksState',
              txHash: '0x1234',
              found: true,
              ok: true,
              events: [],
              block: { hash: '0xabcd', number: 42, index: 3 },
            },
          ],
          () => {
            unsubscribed = true;
          },
        );
      },
    };
    const { api, getAssetArgs, getProxyArgs } = createMockApi(finalTx);

    const result = await executeTransfer(api as any, signer, {
      escrow: '5Escrow',
      assetId: 1984,
      target: '5Target',
      amount: 2500n,
    } as any);

    expect(getAssetArgs()).toEqual({
      id: 1984,
      target: '5Target',
      amount: 2500n,
    });
    expect(getProxyArgs()).toEqual([
      {
        real: '5Escrow',
        call: { tag: 'asset-transfer' },
      },
    ]);
    expect(unsubscribed).toBeTrue();
    expect(result).toEqual({
      txHash: '0x1234',
      blockHash: '0xabcd',
      blockNumber: 42,
      txIndex: 3,
      ok: true,
      dispatchError: undefined,
      events: [],
    });
  });

  test('builds a delegated transfer as nested proxy calls', () => {
    const finalTx = {
      decodedCall: { type: 'Mock', value: 'outer-transfer' },
      signSubmitAndWatch() {
        return createWatchableTx([]);
      },
    };
    const { api, getAssetArgs, getProxyArgs } = createMockApi(finalTx, [
      { decodedCall: { tag: 'delegated-transfer' } },
    ]);

    const tx = createTransferTx(
      api as any,
      {
        controller: '5Controller',
        delegated: '5Delegated',
        assetId: '12',
        target: '5Target',
        amount: 9n,
      } as any,
    );

    expect(getAssetArgs()).toEqual({
      id: '12',
      target: '5Target',
      amount: 9n,
    });
    expect(getProxyArgs()).toEqual([
      {
        real: '5Delegated',
        call: { tag: 'asset-transfer' },
      },
      {
        real: '5Controller',
        call: { tag: 'delegated-transfer' },
      },
    ]);
    expect(tx).toBe(finalTx as any);
  });

  test('rejects invalid best-block inclusion states as InvalidTxError', async () => {
    const signer = createMockSigner();
    const finalTx = {
      decodedCall: { type: 'Mock', value: 'final-transfer' },
      signSubmitAndWatch() {
        return createWatchableTx([
          {
            type: 'txBestBlocksState',
            txHash: '0xdead',
            found: false,
            isValid: false,
          },
        ]);
      },
    };
    const { api } = createMockApi(finalTx);

    await expect(
      executeTransfer(api as any, signer, {
        escrow: '5Escrow',
        assetId: 7,
        target: '5Target',
        amount: 1n,
      } as any),
    ).rejects.toBeInstanceOf(InvalidTxError);
  });
});
