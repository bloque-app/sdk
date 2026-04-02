/**
 * @internal
 * Wire types for Organizations API communication (snake_case format)
 * These types represent the raw API request/response format
 * and should not be used directly by SDK consumers.
 */

/**
 * @internal
 * Organization type
 */
export type OrgType = 'business' | 'individual';

/**
 * @internal
 * Organization status
 */
export type OrgStatus =
  | 'awaiting_compliance_verification'
  | 'active'
  | 'suspended'
  | 'closed';

/**
 * @internal
 * Place/location for organization
 */
export interface Place {
  country_code: string;
  state: string;
  address_line1: string;
  postal_code: string;
  city: string;
  is_primary: boolean;
}

/**
 * @internal
 * Organization profile (snake_case API format)
 */
export interface OrgProfile {
  legal_name: string;
  tax_id: string;
  incorporation_date: string;
  business_type: string;
  incorporation_country_code: string;
  incorporation_state?: string;
  address_line1: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  logo_url?: string;
  places?: Place[];
}

/**
 * @internal
 * Create organization request params
 */
export interface CreateOrgParams {
  org_type: OrgType;
  profile: OrgProfile;
  metadata?: Record<string, unknown>;
}

/**
 * @internal
 * Organization from API
 */
export interface Organization {
  urn: string;
  org_type: OrgType;
  profile: OrgProfile;
  metadata?: Record<string, unknown>;
  status: OrgStatus;
}

/**
 * @internal
 * Create organization response
 */
export interface CreateOrgResponse {
  result: {
    organization: Organization;
  };
  req_id: string;
}

/**
 * @internal
 * Get organization response
 */
export interface GetOrgResponse extends Organization {}

/**
 * @internal
 * List user organizations response
 */
export type ListUserOrgsResponse = Organization[];

/**
 * @internal
 * Verify slug availability response
 */
export interface VerifySlugResponse {
  available: boolean;
  normalized_slug: string;
  suggestions?: string[];
}

/**
 * @internal
 * Organization member
 */
export interface Member {
  urn: string;
  org_urn: string;
  is_public: boolean;
  title: string;
  display_name: string;
  identity_urn: string;
  org_scopes: string[];
  org_roles: string[];
  metadata: Record<string, string>;
}

/**
 * @internal
 * List organization members response
 */
export type ListMembersResponse = Member[];

/**
 * @internal
 * Update member request
 */
export interface UpdateMemberRequest {
  title?: string;
  display_name?: string;
  is_public?: boolean;
  org_scopes?: string[];
  org_roles?: string[];
  metadata?: Record<string, string>;
}

/**
 * @internal
 * Update member response
 */
export interface UpdateMemberResponse {
  result: { member: Member };
  req_id: string;
}

/**
 * @internal
 * Team
 */
export interface Team {
  urn: string;
  org_urn: string;
  name: string;
  image_url: string;
  description: string;
  metadata: Record<string, string>;
}

/**
 * @internal
 * List teams response
 */
export type ListTeamsResponse = Team[];

/**
 * @internal
 * Update team request
 */
export interface UpdateTeamRequest {
  name?: string;
  image_url?: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * @internal
 * Update team response
 */
export interface UpdateTeamResponse {
  result: { team: Team };
  req_id: string;
}

/**
 * @internal
 * Team member
 */
export interface TeamMember {
  team_urn: string;
  member_urn: string;
  team_scopes: string[];
  team_roles: string[];
  metadata: Record<string, string>;
}

/**
 * @internal
 * List team members response
 */
export type ListTeamMembersResponse = TeamMember[];

/**
 * @internal
 * Update team member request
 */
export interface UpdateTeamMemberRequest {
  team_scopes?: string[];
  team_roles?: string[];
  metadata?: Record<string, string>;
}

/**
 * @internal
 * Update team member response
 */
export interface UpdateTeamMemberResponse {
  result: { team_member: TeamMember };
  req_id: string;
}

/**
 * @internal
 * Invite type
 */
export type InviteType = 'member' | 'team';

/**
 * @internal
 * Invite status
 */
export type InviteStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

/**
 * @internal
 * Invite channel
 */
export type InviteChannel = 'email' | 'sms' | 'whatsapp' | 'identity';

/**
 * @internal
 * Invite
 */
export interface Invite {
  code: string;
  org_urn: string;
  org_info: { name: string; logo_url: string };
  sender_member_urn: string;
  sender_info: {
    identity_urn: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  type: InviteType;
  details: Record<string, unknown>;
  channel: InviteChannel;
  channel_routing: Record<string, string>;
  metadata: Record<string, string>;
  status: InviteStatus;
  member_urn?: string;
}

/**
 * @internal
 * Create invite request
 */
export interface CreateInviteRequest {
  type: InviteType;
  details: Record<string, unknown>;
  channel: InviteChannel;
  channel_routing: Record<string, string>;
  metadata?: Record<string, string>;
}

/**
 * @internal
 * Create invite response
 */
export interface CreateInviteResponse {
  result: { invite: Invite };
  req_id: string;
}

/**
 * @internal
 * List invites response (paginated)
 */
export interface ListInvitesResponse {
  data: Invite[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * @internal
 * Invite action response (accept, reject, resend)
 */
export interface InviteActionResponse {
  result: { invite: Invite };
  req_id: string;
}
