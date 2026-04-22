import { kreivo, ksmAssetHub } from '@polkadot-api/descriptors';
import type { ApisTypedef, TxDescriptor } from 'polkadot-api';

export type UnifiedChainDescriptor = typeof kreivo | typeof ksmAssetHub;

type TxPalletsOf<TDescriptor extends UnifiedChainDescriptor> =
  TDescriptor['descriptors']['pallets']['__tx'];

export type DescriptorTxArgs<
  TDescriptor extends UnifiedChainDescriptor,
  TPallet extends keyof TxPalletsOf<TDescriptor>,
  TCall extends keyof TxPalletsOf<TDescriptor>[TPallet],
> =
  TxPalletsOf<TDescriptor>[TPallet][TCall] extends TxDescriptor<infer TArgs>
    ? TArgs
    : never;

export type KreivoProxyArgs = DescriptorTxArgs<typeof kreivo, 'Proxy', 'proxy'>;
export type AssetHubProxyArgs = DescriptorTxArgs<
  typeof ksmAssetHub,
  'Proxy',
  'proxy'
>;
export type ProxyArgs = KreivoProxyArgs | AssetHubProxyArgs;

type DescriptorValue = Awaited<(typeof kreivo)['descriptors']>;

export type SharedChainDefinitionFields<TPallets> = {
  descriptors: Promise<DescriptorValue> & {
    pallets: TPallets;
    apis: ApisTypedef<{}>;
  };
  // These fields are not used by the transfer/teleport helpers. They remain
  // intentionally loose because `TypedApi` threads the asset type through
  // `txFromCallData`, and a union here makes the concrete generated APIs stop
  // being assignable to the shared minimal shape.
  asset: any;
  metadataTypes: any;
  getMetadata: any;
  genesis: any;
};
