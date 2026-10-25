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
