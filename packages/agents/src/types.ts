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
 * Extra environment variable forwarded into the hosted agent on create.
 *
 * `key` is a POSIX-style name (`[A-Z_][A-Z0-9_]*`, 1–128). `value` is a
 * non-empty string (max 4096). `secret` is required. Provision-owned keys
 * (`BLOQUE_API_KEY`, `BLOQUE_API_BASE_URL`, `BLOQUE_RETURN_URL`,
 * `BLOQUE_PUBLISHABLE_KEY`, `INSTINCT_SKILL_URLS`) are rejected by the API.
 */
export interface CreateAgentEnvironmentEntry {
  key: string;
  value: string;
  secret: boolean;
}

/**
 * Public https URL of a skill playbook (`.md` / `SKILL.md`) or a zip of one
 * skill folder. Format is inferred at fetch.
 */
export interface CreateAgentSkillEntry {
  url: string;
}

/**
 * Optional create body for `agents.create()`. Identity comes from the
 * caller JWT — do not send phone, userId, DID, or owner fields.
 */
export interface CreateAgentParams {
  /** Trimmed 1–200 characters when sent. Omit to let the API pick a name. */
  name?: string;
  /**
   * Extra environment variables. Empty array adds nothing. Duplicate keys
   * are rejected. Provision-owned `BLOQUE_*` keys and `INSTINCT_SKILL_URLS`
   * return `E_AGENT_ENV_RESERVED`.
   */
  environment?: CreateAgentEnvironmentEntry[];
  /**
   * Public skill URLs fetched by the hosted agent at boot. Empty array adds
   * nothing. Unique absolute https URLs, max 8. A second create does not
   * re-apply skills.
   */
  skills?: CreateAgentSkillEntry[];
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

/**
 * Connection status of an app on an agent. `connected` is true only for
 * `ACTIVE`.
 */
export type AgentAppStatus =
  | 'INITIALIZING'
  | 'INITIATED'
  | 'ACTIVE'
  | 'FAILED'
  | 'EXPIRED'
  | 'INACTIVE'
  | 'REVOKED';

/**
 * One app offered in the catalog. `slug` is what `apps.connect()` takes.
 */
export interface AgentAppCatalogItem {
  slug: string;
  name: string;
  description: string | null;
  /** Https logo URL when one is available. */
  logo: string | null;
  /** True when the app needs no sign-in. */
  noAuth: boolean;
}

export interface ListAppCatalogParams {
  /** Page size, 1–100. The API defaults to 50. */
  limit?: number;
  /** Opaque offset from the previous page's `nextCursor`. */
  cursor?: string;
}

export interface ListAppCatalogResult {
  data: AgentAppCatalogItem[];
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * One app's connection on an agent. `connected` is true only when status
 * is `ACTIVE`.
 */
export interface AgentApp {
  slug: string;
  status: AgentAppStatus;
  connected: boolean;
}

export interface ListAgentAppsResult {
  data: AgentApp[];
}

export type AgentAppConnectStatus =
  | 'link_issued'
  | 'already_connected'
  | 'no_auth';

/**
 * Outcome of `apps.connect()`. `connectUrl` is present only when status
 * is `link_issued`. Do not log it.
 */
export interface AgentAppConnect {
  app: string;
  status: AgentAppConnectStatus;
  connectUrl?: string;
}

/**
 * Body for `agents.apps.connect()`. `app` is a lowercase slug such as
 * `gmail`.
 */
export interface ConnectAgentAppParams {
  app: string;
}

/**
 * Body for `agents.apps.recommend()`. Does not require an agent URN.
 */
export interface RecommendAppsParams {
  /** What the hosted agent is for. 1–4000 characters. */
  about: string;
  /** Optional display name used in the recommendation copy. Max 80. */
  name?: string;
}

export type RecommendAppsTurnRole = 'owner' | 'mr.bloque';

export interface RecommendAppsTurn {
  role: RecommendAppsTurnRole;
  message: string;
}

export interface RecommendedApp {
  name: string;
  slugs: string[];
  story: string;
  conversation: RecommendAppsTurn[];
  score: number;
}

export interface RecommendAppsResult {
  about: string;
  story: string;
  name?: string;
  data: RecommendedApp[];
}
