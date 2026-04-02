import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import type {
  CreateInviteRequest,
  CreateInviteResponse,
  CreateOrgResponse,
  GetOrgResponse,
  Invite,
  InviteActionResponse,
  ListInvitesResponse,
  ListMembersResponse,
  ListTeamMembersResponse,
  ListTeamsResponse,
  ListUserOrgsResponse,
  Member,
  Team,
  TeamMember,
  UpdateMemberRequest,
  UpdateMemberResponse,
  UpdateTeamMemberRequest,
  UpdateTeamMemberResponse,
  UpdateTeamRequest,
  UpdateTeamResponse,
  VerifySlugResponse,
} from './internal/wire-types';
import type {
  CreateInviteParams,
  CreateOrgParams,
  ListInvitesParams,
  ListInvitesResult,
  Organization,
  UpdateMemberParams,
  UpdateTeamMemberParams,
  UpdateTeamParams,
  VerifySlugResult,
} from './types';

export class MembersClient extends BaseClient {
  /**
   * Update an organization member
   *
   * @param memberUrn - Member URN
   * @param params - Fields to update
   * @returns Updated member
   */
  async update(memberUrn: string, params: UpdateMemberParams): Promise<Member> {
    const request: UpdateMemberRequest = {
      title: params.title,
      display_name: params.displayName,
      is_public: params.isPublic,
      org_scopes: params.orgScopes,
      org_roles: params.orgRoles,
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<UpdateMemberResponse>({
      method: 'PATCH',
      path: `/api/members/${memberUrn}`,
      body: request,
    });

    return response.result.member;
  }

  /**
   * Remove a member from an organization
   *
   * @param orgUrn - Organization URN
   * @param memberUrn - Member URN to remove
   */
  async remove(orgUrn: string, memberUrn: string): Promise<void> {
    await this.httpClient.request<{ result: { success: boolean } }>({
      method: 'DELETE',
      path: `/api/orgs/${orgUrn}/members/${memberUrn}`,
    });
  }
}

export class TeamsClient extends BaseClient {
  /**
   * List teams in an organization
   *
   * @param orgUrn - Organization URN
   * @returns Array of teams
   */
  async list(orgUrn: string): Promise<Team[]> {
    return await this.httpClient.request<ListTeamsResponse>({
      method: 'GET',
      path: `/api/orgs/${orgUrn}/teams`,
    });
  }

  /**
   * Update a team
   *
   * @param teamUrn - Team URN
   * @param params - Fields to update
   * @returns Updated team
   */
  async update(teamUrn: string, params: UpdateTeamParams): Promise<Team> {
    const request: UpdateTeamRequest = {
      name: params.name,
      image_url: params.imageUrl,
      description: params.description,
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<UpdateTeamResponse>({
      method: 'PATCH',
      path: `/api/teams/${teamUrn}`,
      body: request,
    });

    return response.result.team;
  }

  /**
   * List members of a team
   *
   * @param teamUrn - Team URN
   * @returns Array of team members
   */
  async listMembers(teamUrn: string): Promise<TeamMember[]> {
    return await this.httpClient.request<ListTeamMembersResponse>({
      method: 'GET',
      path: `/api/teams/${teamUrn}/members`,
    });
  }

  /**
   * Update a team member's roles and scopes
   *
   * @param teamUrn - Team URN
   * @param memberUrn - Member URN
   * @param params - Fields to update
   * @returns Updated team member
   */
  async updateMember(
    teamUrn: string,
    memberUrn: string,
    params: UpdateTeamMemberParams,
  ): Promise<TeamMember> {
    const request: UpdateTeamMemberRequest = {
      team_scopes: params.teamScopes,
      team_roles: params.teamRoles,
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<UpdateTeamMemberResponse>({
      method: 'PATCH',
      path: `/api/teams/${teamUrn}/members/${memberUrn}`,
      body: request,
    });

    return response.result.team_member;
  }

  /**
   * Remove a member from a team
   *
   * @param teamUrn - Team URN
   * @param memberUrn - Member URN
   */
  async removeMember(teamUrn: string, memberUrn: string): Promise<void> {
    await this.httpClient.request<{ result: { success: boolean } }>({
      method: 'DELETE',
      path: `/api/teams/${teamUrn}/members/${memberUrn}`,
    });
  }
}

export class InvitesClient extends BaseClient {
  /**
   * Create an invite to an organization
   *
   * @param orgUrn - Organization URN
   * @param params - Invite details
   * @returns Created invite
   */
  async create(orgUrn: string, params: CreateInviteParams): Promise<Invite> {
    const request: CreateInviteRequest = {
      type: params.type,
      details: params.details,
      channel: params.channel,
      channel_routing: params.channelRouting,
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<CreateInviteResponse>({
      method: 'POST',
      path: `/api/orgs/${orgUrn}/invite`,
      body: request,
    });

    return response.result.invite;
  }

  /**
   * Get an invite by code
   *
   * @param code - Invite code
   * @returns Invite details
   */
  async get(code: string): Promise<Invite> {
    return await this.httpClient.request<Invite>({
      method: 'GET',
      path: `/api/invite/${code}`,
    });
  }

  /**
   * List invites with optional filters
   *
   * @param params - Filter and pagination parameters
   * @returns Paginated list of invites
   */
  async list(params: ListInvitesParams = {}): Promise<ListInvitesResult> {
    const queryParams = new URLSearchParams();

    if (params.type) queryParams.set('type', params.type);
    if (params.status) queryParams.set('status', params.status);
    if (params.channel) queryParams.set('channel', params.channel);
    if (params.orgUrn) queryParams.set('org_urn', params.orgUrn);
    if (params.teamUrn) queryParams.set('team_urn', params.teamUrn);
    if (params.fromIdentityUrn)
      queryParams.set('from_identity_urn', params.fromIdentityUrn);
    if (params.limit !== undefined)
      queryParams.set('limit', params.limit.toString());
    if (params.offset !== undefined)
      queryParams.set('offset', params.offset.toString());
    if (params.order) queryParams.set('order', params.order);

    const qs = queryParams.toString();
    const path = qs ? `/api/invites?${qs}` : '/api/invites';

    return await this.httpClient.request<ListInvitesResponse>({
      method: 'GET',
      path,
    });
  }

  /**
   * Accept an invite
   *
   * @param code - Invite code
   * @returns Updated invite
   */
  async accept(code: string): Promise<Invite> {
    const response = await this.httpClient.request<InviteActionResponse>({
      method: 'POST',
      path: `/api/invite/${code}/accept`,
    });

    return response.result.invite;
  }

  /**
   * Reject an invite
   *
   * @param code - Invite code
   * @param reason - Optional rejection reason
   * @returns Updated invite
   */
  async reject(code: string, reason?: string): Promise<Invite> {
    const response = await this.httpClient.request<InviteActionResponse>({
      method: 'POST',
      path: `/api/invite/${code}/reject`,
      body: reason ? { reason } : undefined,
    });

    return response.result.invite;
  }

  /**
   * Resend an invite
   *
   * @param code - Invite code
   * @returns Updated invite
   */
  async resend(code: string): Promise<Invite> {
    const response = await this.httpClient.request<InviteActionResponse>({
      method: 'POST',
      path: `/api/invite/${code}/resend`,
    });

    return response.result.invite;
  }
}

export class OrgsClient extends BaseClient {
  readonly members: MembersClient;
  readonly teams: TeamsClient;
  readonly invites: InvitesClient;

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.members = new MembersClient(this.httpClient);
    this.teams = new TeamsClient(this.httpClient);
    this.invites = new InvitesClient(this.httpClient);
  }

  /**
   * Create a new organization
   *
   * @param params - Organization creation parameters
   * @returns Created organization
   */
  async create(params: CreateOrgParams): Promise<Organization> {
    const response = await this.httpClient.request<CreateOrgResponse>({
      method: 'POST',
      path: '/api/orgs',
      body: params,
    });
    return response.result.organization;
  }

  /**
   * Get organization by URN
   *
   * @param orgUrn - Organization URN
   * @returns Organization details
   */
  async get(orgUrn: string): Promise<Organization> {
    return await this.httpClient.request<GetOrgResponse>({
      method: 'GET',
      path: `/api/orgs/${orgUrn}`,
    });
  }

  /**
   * List organizations the current user belongs to
   *
   * @returns Array of organizations
   */
  async list(): Promise<Organization[]> {
    return await this.httpClient.request<ListUserOrgsResponse>({
      method: 'GET',
      path: '/api/identities/me/orgs',
    });
  }

  /**
   * Verify if an organization slug is available
   *
   * @param slug - Slug to verify
   * @returns Slug availability and suggestions
   */
  async verifySlug(slug: string): Promise<VerifySlugResult> {
    const response = await this.httpClient.request<VerifySlugResponse>({
      method: 'GET',
      path: `/api/orgs/verify-slug?slug=${encodeURIComponent(slug)}`,
    });

    return {
      available: response.available,
      normalizedSlug: response.normalized_slug,
      suggestions: response.suggestions,
    };
  }

  /**
   * List members of an organization
   *
   * @param orgUrn - Organization URN
   * @returns Array of members
   */
  async listMembers(orgUrn: string): Promise<Member[]> {
    return await this.httpClient.request<ListMembersResponse>({
      method: 'GET',
      path: `/api/orgs/${orgUrn}/members`,
    });
  }

  /**
   * Delete an organization
   *
   * @param orgUrn - Organization URN
   */
  async delete(orgUrn: string): Promise<void> {
    await this.httpClient.request<void>({
      method: 'DELETE',
      path: `/api/orgs/${orgUrn}`,
    });
  }
}
