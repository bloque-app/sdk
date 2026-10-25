import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import type {
  AgentWire,
  CreateAgentRequest,
  CreateAgentResponse,
  LinkWhatsAppRequest,
  LinkWhatsAppResponse,
  ListAgentsResponse,
  WhatsAppChannelWire,
} from './internal/wire-types';
import type {
  Agent,
  CreateAgentOptions,
  CreateAgentParams,
  LinkWhatsAppOptions,
  LinkWhatsAppParams,
  ListAgentsResult,
  WhatsAppChannel,
} from './types';

function mapAgentWhatsApp(
  wire: AgentWire['channels']['whatsapp'],
): Agent['channels']['whatsapp'] {
  const mapped: Agent['channels']['whatsapp'] = {
    status: wire.status,
    linked: wire.linked,
  };
  if (wire.expires_at !== undefined) {
    mapped.expiresAt = wire.expires_at;
  }
  return mapped;
}

function mapAgent(wire: AgentWire): Agent {
  return {
    urn: wire.urn,
    ownerUrn: wire.owner_urn,
    status: wire.status,
    displayName: wire.display_name,
    channels: {
      whatsapp: mapAgentWhatsApp(wire.channels.whatsapp),
    },
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}

function mapWhatsAppChannel(
  wire: WhatsAppChannelWire,
  includeConnectUrl: boolean,
): WhatsAppChannel {
  const channel: WhatsAppChannel = {
    channel: 'whatsapp',
    status: wire.status,
    linked: wire.linked,
  };

  if (wire.expires_at !== undefined) {
    channel.expiresAt = wire.expires_at;
  }
  if (wire.updated_at !== undefined) {
    channel.updatedAt = wire.updated_at;
  }
  if (includeConnectUrl && wire.connect_url) {
    channel.connectUrl = wire.connect_url;
  }

  return channel;
}

function createHeaders(
  idempotencyKey?: string,
): Record<string, string> | undefined {
  return idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
}

export class WhatsAppChannelClient extends BaseClient {
  /**
   * Get WhatsApp channel status for an agent.
   *
   * Never includes `connectUrl`. While the agent is still provisioning
   * this is `unlinked` (not an error).
   *
   * Errors: `400 E_INVALID_AGENT_URN`, `401`, `404 E_AGENT_NOT_FOUND`.
   */
  async get(agentUrn: string): Promise<WhatsAppChannel> {
    const response = await this.httpClient.request<WhatsAppChannelWire>({
      method: 'GET',
      path: `/api/agents/${agentUrn}/channels/whatsapp`,
    });

    return mapWhatsAppChannel(response, false);
  }

  /**
   * Bind a caller-chosen E.164 phone to this agent's WhatsApp channel.
   *
   * Returns a one-time `connectUrl`. Open it on that handset; do not log
   * `connectUrl` or `phone`. The agent must already be `ready`.
   *
   * Errors: `400 E_INVALID_AGENT_URN` / `E_INVALID_BODY` /
   * `E_AGENT_PHONE_INVALID`, `401`, `403 E_AGENT_FORBIDDEN`,
   * `404 E_AGENT_NOT_FOUND`, `409 E_AGENT_NOT_READY` /
   * `E_AGENT_WHATSAPP_ALREADY_LINKED`, `502 E_AGENT_BACKEND_UNAVAILABLE`,
   * `503 E_AGENT_WHATSAPP_UNAVAILABLE`.
   *
   * @example
   * ```typescript
   * const channel = await clients.agents.whatsapp.link(agent.urn, {
   *   phone,
   * });
   * // Hand channel.connectUrl to the user. Do not log it.
   * ```
   */
  async link(
    agentUrn: string,
    params: LinkWhatsAppParams,
    options?: LinkWhatsAppOptions,
  ): Promise<WhatsAppChannel> {
    const request: LinkWhatsAppRequest = { phone: params.phone };

    const response = await this.httpClient.request<
      LinkWhatsAppResponse,
      LinkWhatsAppRequest
    >({
      method: 'POST',
      path: `/api/agents/${agentUrn}/channels/whatsapp/link`,
      body: request,
      headers: createHeaders(options?.idempotencyKey),
    });

    return mapWhatsAppChannel(response.result, true);
  }
}

export class AgentsClient extends BaseClient {
  readonly whatsapp: WhatsAppChannelClient;

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.whatsapp = new WhatsAppChannelClient(this.httpClient);
  }

  /**
   * Create the caller's hosted personal agent, or return the existing one.
   *
   * Optional `name` only. Identity is the caller JWT — do not send phone,
   * userId, DID, or owner fields. Returns `status: "provisioning"`; poll
   * `get()` until `ready` before linking WhatsApp.
   *
   * Errors: `400 E_INVALID_BODY`, `401`, `403 E_AGENT_FORBIDDEN`,
   * `409 E_AGENT_IDENTITY_CONFLICT`, `429 E_AGENT_CAPACITY`,
   * `502 E_AGENT_API_KEY_UNAVAILABLE` / `E_AGENT_BACKEND_UNAVAILABLE`,
   * `503 E_AGENT_UNAVAILABLE`.
   *
   * @example
   * ```typescript
   * const agent = await clients.agents.create({ name: 'Ada' });
   * ```
   */
  async create(
    params?: CreateAgentParams,
    options?: CreateAgentOptions,
  ): Promise<Agent> {
    const name = params?.name?.trim();
    const body: CreateAgentRequest | undefined =
      name && name.length > 0 ? { name } : undefined;

    const response = await this.httpClient.request<
      CreateAgentResponse,
      CreateAgentRequest
    >({
      method: 'POST',
      path: '/api/agents',
      body,
      headers: createHeaders(options?.idempotencyKey),
    });

    return mapAgent(response.result);
  }

  /**
   * List the caller's agents. Zero or one row.
   *
   * Errors: `401`, `403 E_AGENT_FORBIDDEN`.
   */
  async list(): Promise<ListAgentsResult> {
    const response = await this.httpClient.request<ListAgentsResponse>({
      method: 'GET',
      path: '/api/agents',
    });

    return {
      data: response.data.map(mapAgent),
      pageSize: response.page_size,
      hasMore: response.has_more,
    };
  }

  /**
   * Get an agent by URN and refresh provisioning / WhatsApp status.
   *
   * Nested `channels.whatsapp` never includes `connectUrl`.
   *
   * Errors: `400 E_INVALID_AGENT_URN`, `401`, `404 E_AGENT_NOT_FOUND`.
   */
  async get(agentUrn: string): Promise<Agent> {
    const response = await this.httpClient.request<AgentWire>({
      method: 'GET',
      path: `/api/agents/${agentUrn}`,
    });

    return mapAgent(response);
  }
}
