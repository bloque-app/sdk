import { InvalidTxError, type TxBestBlocksState } from 'polkadot-api';
import type { PolkadotSigner } from 'polkadot-api/signer';

// Structural shape of a PAPI transaction we can subscribe to. The real
// Observable returned by `tx.signSubmitAndWatch` emits a union of `TxEvent`
// variants; we only act on `TxBestBlocksState` and ignore the rest.
export interface WatchableTransaction {
  signSubmitAndWatch: (signer: PolkadotSigner) => {
    subscribe: (observer: {
      next?: (event: TxBestBlocksState | { type: string }) => void;
      error?: (error: unknown) => void;
      complete?: () => void;
    }) => { unsubscribe: () => void };
  };
}

// Resolved on `txBestBlocksState` with `found: true`. `ok` mirrors the chain's
// `System.ExtrinsicSuccess` check; callers that need to treat a dispatch error
// as a failure should read `ok` and `dispatchError` themselves.
export interface BestBlockInclusionResult {
  txHash: string;
  blockHash: string;
  blockNumber: number;
  txIndex: number;
  ok: boolean;
  dispatchError?: TxBestBlocksState extends { dispatchError: infer T }
    ? T
    : { type: string; value: unknown };
  events: TxBestBlocksState extends { events: infer T } ? T : unknown[];
}

// Waits for the extrinsic to reach a best block (not finalized). Rejects with
// `InvalidTxError` if the chain reports the tx as invalid before inclusion, and
// with a generic Error if the subscription closes before either outcome.
export function watchBestBlockInclusion(
  tx: WatchableTransaction,
  signer: PolkadotSigner,
): Promise<BestBlockInclusionResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: { unsubscribe: () => void } | undefined;
    let unsubscribePending = false;

    const unsubscribe = () => {
      if (subscription) {
        subscription.unsubscribe();
        return;
      }

      unsubscribePending = true;
    };

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribe();
      callback();
    };

    subscription = tx.signSubmitAndWatch(signer).subscribe({
      next: (event) => {
        if (!isTxBestBlocksState(event)) {
          return;
        }

        if (!event.found) {
          if (event.isValid) {
            return;
          }

          finish(() => reject(new InvalidTxError(event)));
          return;
        }

        finish(() =>
          resolve({
            txHash: event.txHash,
            blockHash: event.block.hash,
            blockNumber: event.block.number,
            txIndex: event.block.index,
            ok: event.ok,
            dispatchError: event.dispatchError,
            events: event.events,
          }),
        );
      },
      error: (error) => {
        finish(() =>
          reject(
            error instanceof InvalidTxError ? error : new InvalidTxError(error),
          ),
        );
      },
      complete: () => {
        finish(() =>
          reject(
            new Error(
              'transaction watch completed before inclusion in a best block',
            ),
          ),
        );
      },
    });

    if (unsubscribePending) {
      subscription.unsubscribe();
    }
  });
}

function isTxBestBlocksState(
  event: TxBestBlocksState | { type: string },
): event is TxBestBlocksState {
  return event.type === 'txBestBlocksState';
}
