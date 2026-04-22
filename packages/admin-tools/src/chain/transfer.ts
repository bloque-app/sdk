import type { PolkadotSigner } from 'polkadot-api/signer';
import type {
  AssetHubProxyArgs,
  KreivoProxyArgs,
} from './descriptors/shared.ts';
import type {
  AssetHubTransferApi,
  AssetHubTransferArgs,
  KreivoTransferApi,
  KreivoTransferArgs,
  TransferApi,
} from './descriptors/transfer-api.ts';
import {
  type BestBlockInclusionResult,
  type WatchableTransaction,
  watchBestBlockInclusion,
} from './submit.ts';

type KreivoTransferTransaction = ReturnType<
  KreivoTransferApi['tx']['Proxy']['proxy']
>;
type AssetHubTransferTransaction = ReturnType<
  AssetHubTransferApi['tx']['Proxy']['proxy']
>;
type TransferTransaction =
  | KreivoTransferTransaction
  | AssetHubTransferTransaction;

interface BaseTransferParams<
  TTransferArgs extends { id: unknown; target: unknown; amount: bigint },
> {
  assetId: TTransferArgs['id'];
  target: TTransferArgs['target'];
  amount: TTransferArgs['amount'];
}

export interface KreivoEscrowTransferParams
  extends BaseTransferParams<KreivoTransferArgs> {
  escrow: KreivoProxyArgs['real'];
}

export interface AssetHubEscrowTransferParams
  extends BaseTransferParams<AssetHubTransferArgs> {
  escrow: AssetHubProxyArgs['real'];
}

export interface KreivoDelegatedTransferParams
  extends BaseTransferParams<KreivoTransferArgs> {
  controller: KreivoProxyArgs['real'];
  delegated: KreivoProxyArgs['real'];
}

export interface AssetHubDelegatedTransferParams
  extends BaseTransferParams<AssetHubTransferArgs> {
  controller: AssetHubProxyArgs['real'];
  delegated: AssetHubProxyArgs['real'];
}

export type KreivoTransferParams =
  | KreivoEscrowTransferParams
  | KreivoDelegatedTransferParams;
export type AssetHubTransferParams =
  | AssetHubEscrowTransferParams
  | AssetHubDelegatedTransferParams;
export type TransferParams = KreivoTransferParams | AssetHubTransferParams;

export type TransferSubmissionResult = BestBlockInclusionResult;

export function createTransferTx(
  api: KreivoTransferApi,
  params: KreivoTransferParams,
): KreivoTransferTransaction;
export function createTransferTx(
  api: AssetHubTransferApi,
  params: AssetHubTransferParams,
): AssetHubTransferTransaction;
export function createTransferTx(
  api: TransferApi,
  params: TransferParams,
): WatchableTransaction;
export function createTransferTx(
  api: TransferApi,
  params: TransferParams,
): TransferTransaction {
  const assetTransfer = api.tx.Assets.transfer({
    id: params.assetId,
    target: params.target,
    amount: params.amount,
  } as never) as TransferTransaction;

  if ('escrow' in params) {
    return api.tx.Proxy.proxy({
      real: params.escrow,
      call: assetTransfer.decodedCall,
    } as never) as TransferTransaction;
  }

  const delegatedTransfer = api.tx.Proxy.proxy({
    real: params.delegated,
    call: assetTransfer.decodedCall,
  } as never) as TransferTransaction;

  return api.tx.Proxy.proxy({
    real: params.controller,
    call: delegatedTransfer.decodedCall,
  } as never) as TransferTransaction;
}

export function executeTransfer(
  api: KreivoTransferApi,
  signer: PolkadotSigner,
  params: KreivoTransferParams,
): Promise<TransferSubmissionResult>;
export function executeTransfer(
  api: AssetHubTransferApi,
  signer: PolkadotSigner,
  params: AssetHubTransferParams,
): Promise<TransferSubmissionResult>;
export function executeTransfer(
  api: TransferApi,
  signer: PolkadotSigner,
  params: TransferParams,
): Promise<TransferSubmissionResult> {
  return watchBestBlockInclusion(
    createTransferTx(api, params) as WatchableTransaction,
    signer,
  );
}
