export type {
  CreateOrgParams,
  CreateOrgResponse,
  Organization,
  OrgProfile,
  OrgStatus,
  OrgType,
  Place,
} from '@bloque/sdk-orgs';

import { OrgsClient } from '@bloque/sdk-orgs';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Orgs = lazyClient<OrgsClient>(
  () => new OrgsClient(getHttpClient()),
);
