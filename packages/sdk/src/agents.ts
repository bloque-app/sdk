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
  CreateAgentEnvironmentEntry,
  CreateAgentOptions,
  CreateAgentParams,
  CreateAgentSkillEntry,
  LinkWhatsAppOptions,
  LinkWhatsAppParams,
  ListAgentAppsResult,
  ListAgentsResult,
  ListAppCatalogParams,
  ListAppCatalogResult,
  RecommendAppsFit,
  RecommendAppsParams,
  RecommendAppsResult,
  RecommendAppsSource,
  RecommendAppsStories,
  RecommendAppsTurn,
  RecommendAppsTurnRole,
  RecommendedApp,
  WhatsAppChannel,
  WhatsAppChannelStatus,
} from '@bloque/sdk-agents';

import { AgentsClient } from '@bloque/sdk-agents';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Agents = lazyClient<AgentsClient>(
  () => new AgentsClient(getHttpClient()),
);
