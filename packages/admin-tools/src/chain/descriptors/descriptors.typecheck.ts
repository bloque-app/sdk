import { kreivo, ksmAssetHub } from '@polkadot-api/descriptors';
import type { AssetHubApi, KreivoApi } from '../clients.ts';
import type {
  DescriptorTxArgs,
  ProxyArgs,
  KreivoProxyArgs,
  AssetHubProxyArgs,
} from './shared.ts';
import type {
  AssetHubTeleportArgs,
  KreivoTeleportArgs,
  TeleportApi,
  TeleportArgs,
} from './teleport-api.ts';
import type {
  AssetHubTransferArgs,
  KreivoTransferArgs,
  TransferApi,
  TransferArgs,
} from './transfer-api.ts';

type Expect<T extends true> = T;
type ExpectFalse<T extends false> = T;
type IsAssignable<From, To> = From extends To ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
      ? true
      : false
    : false;

type TransferApiArgs = Parameters<TransferApi['tx']['Assets']['transfer']>[0];
type TransferApiProxyArgs = Parameters<TransferApi['tx']['Proxy']['proxy']>[0];
type TeleportApiArgs = Parameters<
  TeleportApi['tx']['PolkadotXcm']['transfer_assets_using_type_and_then']
>[0];
type TeleportApiProxyArgs = Parameters<TeleportApi['tx']['Proxy']['proxy']>[0];

type _KreivoSatisfiesTransferApi = Expect<IsAssignable<KreivoApi, TransferApi>>;
type _AssetHubSatisfiesTransferApi = Expect<
  IsAssignable<AssetHubApi, TransferApi>
>;
type _KreivoSatisfiesTeleportApi = Expect<IsAssignable<KreivoApi, TeleportApi>>;
type _AssetHubSatisfiesTeleportApi = Expect<
  IsAssignable<AssetHubApi, TeleportApi>
>;

type _TransferApiArgsMatchExport = Expect<Equal<TransferApiArgs, TransferArgs>>;
type _TransferApiProxyArgsMatchExport = Expect<
  Equal<TransferApiProxyArgs, ProxyArgs>
>;
type _TeleportApiArgsMatchExport = Expect<Equal<TeleportApiArgs, TeleportArgs>>;
type _TeleportApiProxyArgsMatchExport = Expect<
  Equal<TeleportApiProxyArgs, ProxyArgs>
>;

type _KreivoTransferArgsMatchDescriptor = Expect<
  Equal<
    KreivoTransferArgs,
    DescriptorTxArgs<typeof kreivo, 'Assets', 'transfer'>
  >
>;
type _AssetHubTransferArgsMatchDescriptor = Expect<
  Equal<
    AssetHubTransferArgs,
    DescriptorTxArgs<typeof ksmAssetHub, 'Assets', 'transfer'>
  >
>;
type _KreivoProxyArgsMatchDescriptor = Expect<
  Equal<KreivoProxyArgs, DescriptorTxArgs<typeof kreivo, 'Proxy', 'proxy'>>
>;
type _AssetHubProxyArgsMatchDescriptor = Expect<
  Equal<
    AssetHubProxyArgs,
    DescriptorTxArgs<typeof ksmAssetHub, 'Proxy', 'proxy'>
  >
>;
type _KreivoTeleportArgsMatchDescriptor = Expect<
  Equal<
    KreivoTeleportArgs,
    DescriptorTxArgs<
      typeof kreivo,
      'PolkadotXcm',
      'transfer_assets_using_type_and_then'
    >
  >
>;
type _AssetHubTeleportArgsMatchDescriptor = Expect<
  Equal<
    AssetHubTeleportArgs,
    DescriptorTxArgs<
      typeof ksmAssetHub,
      'PolkadotXcm',
      'transfer_assets_using_type_and_then'
    >
  >
>;
type _TeleportArgsAreSharedAcrossChains = Expect<
  Equal<KreivoTeleportArgs, AssetHubTeleportArgs>
>;

type _TransferIdIsNotAny = ExpectFalse<IsAny<TransferArgs['id']>>;
type _TransferTargetIsNotAny = ExpectFalse<IsAny<TransferArgs['target']>>;
type _TransferAmountIsNotAny = ExpectFalse<IsAny<TransferArgs['amount']>>;
type _ProxyRealIsNotAny = ExpectFalse<IsAny<ProxyArgs['real']>>;
type _ProxyTypeIsNotAny = ExpectFalse<IsAny<ProxyArgs['force_proxy_type']>>;
type _ProxyCallIsNotAny = ExpectFalse<IsAny<ProxyArgs['call']>>;
type _TeleportDestIsNotAny = ExpectFalse<IsAny<TeleportArgs['dest']>>;
type _TeleportAssetsIsNotAny = ExpectFalse<IsAny<TeleportArgs['assets']>>;
type _TeleportAssetsTransferTypeIsNotAny = ExpectFalse<
  IsAny<TeleportArgs['assets_transfer_type']>
>;
type _TeleportRemoteFeesIdIsNotAny = ExpectFalse<
  IsAny<TeleportArgs['remote_fees_id']>
>;
type _TeleportFeesTransferTypeIsNotAny = ExpectFalse<
  IsAny<TeleportArgs['fees_transfer_type']>
>;
type _TeleportCustomXcmIsNotAny = ExpectFalse<
  IsAny<TeleportArgs['custom_xcm_on_dest']>
>;
type _TeleportWeightLimitIsNotAny = ExpectFalse<
  IsAny<TeleportArgs['weight_limit']>
>;

export {};
