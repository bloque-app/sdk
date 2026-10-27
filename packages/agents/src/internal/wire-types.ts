/**
 * @internal
 * Wire types for the Agents API (snake_case).
 * Do not use these from SDK consumers.
 */

export type AgentStatusWire =
  | 'provisioning'
  | 'ready'
  | 'needs_attention'
  | 'failed';

export type WhatsAppChannelStatusWire = 'unlinked' | 'link_pending' | 'linked';

export interface AgentWhatsAppChannelWire {
  status: WhatsAppChannelStatusWire;
  linked: boolean;
  expires_at?: string | null;
}

export interface AgentWire {
  urn: string;
  owner_urn: string;
  status: AgentStatusWire;
  display_name: string;
  channels: {
    whatsapp: AgentWhatsAppChannelWire;
  };
  created_at: string;
  updated_at: string;
}

export interface WhatsAppChannelWire {
  channel: 'whatsapp';
  status: WhatsAppChannelStatusWire;
  linked: boolean;
  connect_url?: string;
  expires_at?: string | null;
  updated_at?: string;
}

export interface CreateAgentRequest {
  name?: string;
}

export interface CreateAgentResponse {
  result: AgentWire;
  req_id: string;
}

export interface ListAgentsResponse {
  data: AgentWire[];
  page_size: number;
  has_more: boolean;
}

export interface LinkWhatsAppRequest {
  phone: string;
}

export interface LinkWhatsAppResponse {
  result: WhatsAppChannelWire;
  req_id: string;
}

export type AgentAppStatusWire =
  | 'INITIALIZING'
  | 'INITIATED'
  | 'ACTIVE'
  | 'FAILED'
  | 'EXPIRED'
  | 'INACTIVE'
  | 'REVOKED';

export interface AgentAppCatalogItemWire {
  slug: string;
  name: string;
  description: string | null;
  logo: string | null;
  no_auth: boolean;
}

export interface ListAppCatalogResponse {
  data: AgentAppCatalogItemWire[];
  page_size: number;
  has_more: boolean;
  next_cursor: string | null;
}

export interface AgentAppWire {
  slug: string;
  status: AgentAppStatusWire;
  connected: boolean;
}

export interface ListAgentAppsResponse {
  data: AgentAppWire[];
}

export type AgentAppConnectStatusWire =
  | 'link_issued'
  | 'already_connected'
  | 'no_auth';

export interface AgentAppConnectWire {
  app: string;
  status: AgentAppConnectStatusWire;
  connect_url?: string;
}

export interface ConnectAgentAppResponse {
  result: AgentAppConnectWire;
  req_id: string;
}
