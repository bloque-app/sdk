import { kreivo, ksmAssetHub } from '@polkadot-api/descriptors';
import type { TypedApi } from 'polkadot-api';
import { createWsClient } from 'polkadot-api/ws';

export type KreivoApi = TypedApi<typeof kreivo>;
export type AssetHubApi = TypedApi<typeof ksmAssetHub>;

export interface ChainEndpoints {
  kreivo: string;
  assetHub: string;
}

export interface ChainClients {
  kreivo: {
    client: ReturnType<typeof createWsClient>;
    api: KreivoApi;
  };
  assetHub: {
    client: ReturnType<typeof createWsClient>;
    api: AssetHubApi;
  };
  destroy: () => void;
}

export function createChainClients(endpoints: ChainEndpoints): ChainClients {
  const kreivoClient = createWsClient(endpoints.kreivo);
  const assetHubClient = createWsClient(endpoints.assetHub);

  return {
    kreivo: { client: kreivoClient, api: kreivoClient.getTypedApi(kreivo) },
    assetHub: {
      client: assetHubClient,
      api: assetHubClient.getTypedApi(ksmAssetHub),
    },
    destroy: () => {
      kreivoClient.destroy();
      assetHubClient.destroy();
    },
  };
}
