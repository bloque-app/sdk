import {
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmV5AssetFilter,
  XcmV5Instruction,
  XcmV5Junction,
  XcmV5Junctions,
  XcmV5WildAsset,
  XcmVersionedAssetId,
  XcmVersionedAssets,
  XcmVersionedLocation,
  XcmVersionedXcm,
} from '@polkadot-api/descriptors';
import { ss58Decode } from '@polkadot-labs/hdkd-helpers';
import type { PolkadotSigner } from 'polkadot-api/signer';
import type {
  AssetHubProxyArgs,
  KreivoProxyArgs,
} from './descriptors/shared.ts';
import type {
  AssetHubTeleportApi,
  KreivoTeleportApi,
  TeleportApi,
} from './descriptors/teleport-api.ts';
import {
  type BestBlockInclusionResult,
  type WatchableTransaction,
  watchBestBlockInclusion,
} from './submit.ts';

// Source: payment-rails/substrate-rail/src/rails/substrate/mod.rs
export const KREIVO_PARA_ID = 2281;
export const ASSET_HUB_PARA_ID = 1000;

// Native KSM seen from a parachain — always `{ parents: 1, interior: Here }`.
const NATIVE_KSM_LOCATION = {
  parents: 1,
  interior: XcmV5Junctions.Here(),
};

export type XcmAssetLocation = {
  parents: number;
  interior: ReturnType<
    | typeof XcmV5Junctions.Here
    | typeof XcmV5Junctions.X1
    | typeof XcmV5Junctions.X2
    | typeof XcmV5Junctions.X3
    | typeof XcmV5Junctions.X4
  >;
};

export type TeleportDirection = 'kreivo->asset-hub' | 'asset-hub->kreivo';

interface BaseTeleportParams<TProxyArgs> {
  direction: TeleportDirection;
  // Asset to teleport, expressed as an XCM v5 location on the SOURCE chain.
  // Callers compute this from a chain-specific asset map (see
  // payment-rails/tasks/src/fixtures/asset-hub.ts for the AssetHub side).
  transferAsset: XcmAssetLocation;
  transferAmount: bigint;
  // Defaults to native KSM (`parents: 1, interior: Here`) when omitted.
  feeAsset?: XcmAssetLocation;
  feeAmount: bigint;
  // SS58 address of the recipient on the destination chain.
  beneficiary: string;
  // Account whose proxy permission is being exercised — typically the proxy
  // controller's "real" parameter (escrow account).
  real: TProxyArgs;
}

export type KreivoTeleportParams = BaseTeleportParams<KreivoProxyArgs['real']>;
export type AssetHubTeleportParams = BaseTeleportParams<
  AssetHubProxyArgs['real']
>;
export type TeleportParams = KreivoTeleportParams | AssetHubTeleportParams;

type KreivoTeleportTransaction = ReturnType<
  KreivoTeleportApi['tx']['Proxy']['proxy']
>;
type AssetHubTeleportTransaction = ReturnType<
  AssetHubTeleportApi['tx']['Proxy']['proxy']
>;
type TeleportTransaction =
  | KreivoTeleportTransaction
  | AssetHubTeleportTransaction;

export type TeleportSubmissionResult = BestBlockInclusionResult;

export function createTeleportTx(
  api: KreivoTeleportApi,
  params: KreivoTeleportParams,
): KreivoTeleportTransaction;
export function createTeleportTx(
  api: AssetHubTeleportApi,
  params: AssetHubTeleportParams,
): AssetHubTeleportTransaction;
export function createTeleportTx(
  api: TeleportApi,
  params: TeleportParams,
): WatchableTransaction;
export function createTeleportTx(
  api: TeleportApi,
  params: TeleportParams,
): TeleportTransaction {
  const xcmCall = buildXcmTeleport(api, params);

  return api.tx.Proxy.proxy({
    real: params.real,
    call: xcmCall.decodedCall,
  } as never) as TeleportTransaction;
}

export function executeTeleport(
  api: KreivoTeleportApi,
  signer: PolkadotSigner,
  params: KreivoTeleportParams,
): Promise<TeleportSubmissionResult>;
export function executeTeleport(
  api: AssetHubTeleportApi,
  signer: PolkadotSigner,
  params: AssetHubTeleportParams,
): Promise<TeleportSubmissionResult>;
export function executeTeleport(
  api: TeleportApi,
  signer: PolkadotSigner,
  params: TeleportParams,
): Promise<TeleportSubmissionResult> {
  return watchBestBlockInclusion(
    createTeleportTx(api, params) as WatchableTransaction,
    signer,
  );
}

function buildXcmTeleport(
  api: TeleportApi,
  params: TeleportParams,
): TeleportTransaction {
  const destParaId =
    params.direction === 'kreivo->asset-hub'
      ? ASSET_HUB_PARA_ID
      : KREIVO_PARA_ID;

  // Per payment-rails/substrate-rail/src/rails/substrate/{kreivo,asset_hub}/crafter.rs:
  // sending OUT from Kreivo uses DestinationReserve (Kreivo holds the reserve);
  // sending OUT from Asset Hub uses LocalReserve (Asset Hub is itself the reserve).
  const transferType =
    params.direction === 'kreivo->asset-hub'
      ? { type: 'DestinationReserve' as const, value: undefined }
      : { type: 'LocalReserve' as const, value: undefined };

  const dest = XcmVersionedLocation.V5({
    parents: 1,
    interior: XcmV5Junctions.X1(XcmV5Junction.Parachain(destParaId)),
  });

  const feeAsset = params.feeAsset ?? NATIVE_KSM_LOCATION;
  const xcmAssets = isSameLocation(params.transferAsset, feeAsset)
    ? [
        {
          id: params.transferAsset,
          fun: XcmV3MultiassetFungibility.Fungible(
            params.transferAmount + params.feeAmount,
          ),
        },
      ]
    : [
        {
          id: feeAsset,
          fun: XcmV3MultiassetFungibility.Fungible(params.feeAmount),
        },
        {
          id: params.transferAsset,
          fun: XcmV3MultiassetFungibility.Fungible(params.transferAmount),
        },
      ];

  const beneficiaryBytes = decodeAccountId32(params.beneficiary);
  const customXcm = XcmVersionedXcm.V5([
    XcmV5Instruction.DepositAsset({
      assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.All()),
      beneficiary: {
        parents: 0,
        interior: XcmV5Junctions.X1(
          XcmV5Junction.AccountId32({
            network: undefined,
            id: beneficiaryBytes,
          }),
        ),
      },
    }),
  ]);

  return api.tx.PolkadotXcm.transfer_assets_using_type_and_then({
    dest,
    assets: XcmVersionedAssets.V5(xcmAssets),
    assets_transfer_type: transferType,
    remote_fees_id: XcmVersionedAssetId.V5(feeAsset),
    fees_transfer_type: transferType,
    custom_xcm_on_dest: customXcm,
    weight_limit: XcmV3WeightLimit.Unlimited(),
  } as never) as TeleportTransaction;
}

// SizedHex<32> is a hex-prefixed string in PAPI's typing — convert SS58 → bytes
// via hdkd-helpers, then back to a 0x-prefixed 32-byte hex string.
function decodeAccountId32(ss58: string): `0x${string}` {
  const [bytes] = ss58Decode(ss58);
  if (bytes.length !== 32) {
    throw new Error(
      `beneficiary SS58 ${ss58} decodes to ${bytes.length} bytes; expected 32 (AccountId32)`,
    );
  }
  return `0x${Buffer.from(bytes).toString('hex')}`;
}

function isSameLocation(a: XcmAssetLocation, b: XcmAssetLocation): boolean {
  if (a.parents !== b.parents) return false;
  // XcmV5Junctions is an Enum<{...}>; equality reduces to type+value match.
  if (a.interior.type !== b.interior.type) return false;
  return JSON.stringify(a.interior.value) === JSON.stringify(b.interior.value);
}
