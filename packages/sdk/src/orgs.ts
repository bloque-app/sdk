export type {
  CreateInviteParams,
  CreateOrgParams,
  CreateOrgResponse,
  Invite,
  InviteChannel,
  InviteStatus,
  InviteType,
  ListInvitesParams,
  ListInvitesResult,
  Member,
  Organization,
  OrgProfile,
  OrgStatus,
  OrgType,
  Place,
  Team,
  TeamMember,
  UpdateMemberParams,
  UpdateTeamMemberParams,
  UpdateTeamParams,
  VerifySlugResult,
} from '@bloque/sdk-orgs';

import { OrgsClient } from '@bloque/sdk-orgs';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Orgs = lazyClient<OrgsClient>(
  () => new OrgsClient(getHttpClient()),
);
