export type {
  Agent,
  AgentApp,
  AgentAppCatalogItem,
  AgentAppConnect,
  AgentAppConnectStatus,
  AgentAppStatus,
  AgentStatus,
  AgentWhatsAppChannel,
  ConnectAgentAppParams,
  CreateAgentOptions,
  CreateAgentParams,
  LinkWhatsAppOptions,
  LinkWhatsAppParams,
  ListAgentAppsResult,
  ListAgentsResult,
  ListAppCatalogParams,
  ListAppCatalogResult,
  WhatsAppChannel,
  WhatsAppChannelStatus,
} from '@bloque/sdk-agents';

import { AgentsClient } from '@bloque/sdk-agents';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Agents = lazyClient<AgentsClient>(
  () => new AgentsClient(getHttpClient()),
);
