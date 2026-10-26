export type {
  Agent,
  AgentStatus,
  AgentWhatsAppChannel,
  CreateAgentOptions,
  CreateAgentParams,
  LinkWhatsAppOptions,
  LinkWhatsAppParams,
  ListAgentsResult,
  WhatsAppChannel,
  WhatsAppChannelStatus,
} from '@bloque/sdk-agents';

import { AgentsClient } from '@bloque/sdk-agents';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Agents = lazyClient<AgentsClient>(
  () => new AgentsClient(getHttpClient()),
);
