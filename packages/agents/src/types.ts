/**
 * Public types for @bloque/sdk-agents
 */

export type AgentStatus =
  | 'provisioning'
  | 'ready'
  | 'needs_attention'
  | 'failed';

export type WhatsAppChannelStatus = 'unlinked' | 'link_pending' | 'linked';

/**
 * Nested WhatsApp summary on an Agent. Never includes `connectUrl`.
 */
export interface AgentWhatsAppChannel {
  status: WhatsAppChannelStatus;
  linked: boolean;
  expiresAt?: string | null;
}

/**
 * Hosted personal agent. One per caller.
 *
 * `secretKey` and `apiKeyId` are never returned on this resource.
 */
export interface Agent {
  urn: string;
  ownerUrn: string;
  status: AgentStatus;
  displayName: string;
  channels: {
    whatsapp: AgentWhatsAppChannel;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * WhatsApp channel on an agent.
 *
 * `connectUrl` is only present on `whatsapp.link()` (HTTP 201). GET status
 * never includes it. Do not log `connectUrl` or the phone used to link.
 */
export interface WhatsAppChannel {
  channel: 'whatsapp';
  status: WhatsAppChannelStatus;
  linked: boolean;
  connectUrl?: string;
  expiresAt?: string | null;
  updatedAt?: string;
}

/**
 * Optional display name for `agents.create()`. Identity comes from the
 * caller JWT — do not send phone, userId, DID, or owner fields.
 */
export interface CreateAgentParams {
  /** Trimmed 1–200 characters when sent. Omit to let the API pick a name. */
  name?: string;
}

export interface CreateAgentOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   * Required by the API; the HTTP client generates one when omitted.
   */
  idempotencyKey?: string;
}

export interface ListAgentsResult {
  data: Agent[];
  pageSize: number;
  hasMore: boolean;
}

/**
 * Body for `agents.whatsapp.link()`. `phone` must be E.164
 * (`+` and 7–15 digits, first digit 1–9).
 */
export interface LinkWhatsAppParams {
  phone: string;
}

export interface LinkWhatsAppOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   * Required by the API; the HTTP client generates one when omitted.
   */
  idempotencyKey?: string;
}
