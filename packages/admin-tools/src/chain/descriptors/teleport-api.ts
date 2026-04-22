import { kreivo, ksmAssetHub } from '@polkadot-api/descriptors';
import type { PalletsTypedef, TxDescriptor, TypedApi } from 'polkadot-api';
import type {
  DescriptorTxArgs,
  SharedChainDefinitionFields,
} from './shared.ts';

export type KreivoTeleportArgs = DescriptorTxArgs<
  typeof kreivo,
  'PolkadotXcm',
  'transfer_assets_using_type_and_then'
>;
export type AssetHubTeleportArgs = DescriptorTxArgs<
  typeof ksmAssetHub,
  'PolkadotXcm',
  'transfer_assets_using_type_and_then'
>;
export type TeleportArgs = KreivoTeleportArgs | AssetHubTeleportArgs;

type TeleportSdkPalletsFor<
  TTeleportArgs extends {} | undefined,
  TProxyArgs extends {} | undefined,
> = PalletsTypedef<
  // biome-ignore lint/complexity/noBannedTypes: empty section placeholder for PalletsTypedef
  {},
  {
    PolkadotXcm: {
      transfer_assets_using_type_and_then: TxDescriptor<TTeleportArgs>;
    };
    Proxy: {
      proxy: TxDescriptor<TProxyArgs>;
    };
  },
  // biome-ignore lint/complexity/noBannedTypes: empty section placeholder
  {},
  // biome-ignore lint/complexity/noBannedTypes: empty section placeholder
  {},
  // biome-ignore lint/complexity/noBannedTypes: empty section placeholder
  {},
  // biome-ignore lint/complexity/noBannedTypes: empty section placeholder
  {}
>;

export type KreivoTeleportSdkPallets = TeleportSdkPalletsFor<
  KreivoTeleportArgs,
  DescriptorTxArgs<typeof kreivo, 'Proxy', 'proxy'>
>;
export type AssetHubTeleportSdkPallets = TeleportSdkPalletsFor<
  AssetHubTeleportArgs,
  DescriptorTxArgs<typeof ksmAssetHub, 'Proxy', 'proxy'>
>;

// Minimal structural shape for cross-chain XCM teleports. Both Kreivo and
// Kusama Asset Hub expose `PolkadotXcm.transfer_assets_using_type_and_then`.
// The arg objects are taken from the generated descriptors directly so this
// shared type follows concrete XCM shapes across both chains.
export type TeleportSdkPallets =
  | KreivoTeleportSdkPallets
  | AssetHubTeleportSdkPallets;

export type KreivoTeleportApi = TypedApi<
  SharedChainDefinitionFields<KreivoTeleportSdkPallets>
>;
export type AssetHubTeleportApi = TypedApi<
  SharedChainDefinitionFields<AssetHubTeleportSdkPallets>
>;
export type TeleportApi = KreivoTeleportApi | AssetHubTeleportApi;
