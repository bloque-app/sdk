/**
 * Public types for @bloque/sdk-orgs
 */

export type {
  CreateOrgParams,
  CreateOrgResponse,
  Invite,
  InviteChannel,
  InviteStatus,
  InviteType,
  Member,
  Organization,
  OrgProfile,
  OrgStatus,
  OrgType,
  Place,
  Team,
  TeamMember,
} from './internal/wire-types';

/**
 * Result of verifying slug availability
 */
export interface VerifySlugResult {
  available: boolean;
  normalizedSlug: string;
  suggestions?: string[];
}

/**
 * Parameters for listing invites
 */
export interface ListInvitesParams {
  type?: 'member' | 'team';
  status?: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  channel?: 'email' | 'sms' | 'whatsapp' | 'identity';
  orgUrn?: string;
  teamUrn?: string;
  fromIdentityUrn?: string;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

/**
 * Paginated invite list result
 */
export interface ListInvitesResult {
  data: import('./internal/wire-types').Invite[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Parameters for creating an invite
 */
export interface CreateInviteParams {
  type: 'member' | 'team';
  details: Record<string, unknown>;
  channel: 'email' | 'sms' | 'whatsapp' | 'identity';
  channelRouting: Record<string, string>;
  metadata?: Record<string, string>;
}

/**
 * Parameters for updating a member
 */
export interface UpdateMemberParams {
  title?: string;
  displayName?: string;
  isPublic?: boolean;
  orgScopes?: string[];
  orgRoles?: string[];
  metadata?: Record<string, string>;
}

/**
 * Parameters for updating a team
 */
export interface UpdateTeamParams {
  name?: string;
  imageUrl?: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Parameters for updating a team member
 */
export interface UpdateTeamMemberParams {
  teamScopes?: string[];
  teamRoles?: string[];
  metadata?: Record<string, string>;
}

/**
 * Result of `orgs.assumeOrigin(namespace)`.
 *
 * 15-minute `kind: origin-operator` JWT. `sub` is the controller org URN;
 * `origin` is the namespace; `act.sub` is the human who assumed. Org-admin
 * scopes never enter this token.
 */
export interface AssumeOriginResult {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Parameters for `orgs.createOrigin(orgUrn, params)`.
 *
 * Requires a KYB-verified (`active`) org and `orgs.write`. The origin is
 * created as `provider: api-key`, bound to this org, and the origin API
 * key is returned once.
 */
export interface CreateOriginParams {
  namespace: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of `orgs.createOrigin`. `originApiKey` is shown only once.
 */
export interface CreateOriginResult {
  origin: string;
  orgUrn: string;
  originApiKey: string;
  roles: string[];
}
