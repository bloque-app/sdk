import { kreivo, ksmAssetHub } from '@polkadot-api/descriptors';
import type { PalletsTypedef, TxDescriptor, TypedApi } from 'polkadot-api';
import type {
  DescriptorTxArgs,
  SharedChainDefinitionFields,
} from './shared.ts';

export type KreivoTransferArgs = DescriptorTxArgs<
  typeof kreivo,
  'Assets',
  'transfer'
>;
export type AssetHubTransferArgs = DescriptorTxArgs<
  typeof ksmAssetHub,
  'Assets',
  'transfer'
>;
export type TransferArgs = KreivoTransferArgs | AssetHubTransferArgs;

type TransferSdkPalletsFor<
  TTransferArgs extends {} | undefined,
  TProxyArgs extends {} | undefined,
> = PalletsTypedef<
  // biome-ignore lint/complexity/noBannedTypes: empty section placeholder for PalletsTypedef
  {},
  {
    Assets: {
      transfer: TxDescriptor<TTransferArgs>;
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

export type KreivoTransferSdkPallets = TransferSdkPalletsFor<
  KreivoTransferArgs,
  DescriptorTxArgs<typeof kreivo, 'Proxy', 'proxy'>
>;
export type AssetHubTransferSdkPallets = TransferSdkPalletsFor<
  AssetHubTransferArgs,
  DescriptorTxArgs<typeof ksmAssetHub, 'Proxy', 'proxy'>
>;

// Minimal structural shape for the pallets/calls we need to execute simple
// transfers on either Kreivo or Kusama Asset Hub. The arg objects are sourced
// directly from the generated descriptors so the unified API stays aligned with
// the concrete chain metadata instead of hand-maintained `any` placeholders.
export type TransferSdkPallets =
  | KreivoTransferSdkPallets
  | AssetHubTransferSdkPallets;

export type KreivoTransferApi = TypedApi<
  SharedChainDefinitionFields<KreivoTransferSdkPallets>
>;
export type AssetHubTransferApi = TypedApi<
  SharedChainDefinitionFields<AssetHubTransferSdkPallets>
>;
export type TransferApi = KreivoTransferApi | AssetHubTransferApi;
