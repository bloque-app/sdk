export type {
  CreateOrgParams,
  CreateOrgResponse,
  Organization,
  OrgProfile,
  OrgStatus,
  OrgType,
  Place,
} from '@bloque/sdk-orgs';

import { HttpClient } from '@bloque/sdk-core';
import { OrgsClient } from '@bloque/sdk-orgs';
import { getConfig } from './config';

const httpClient = new HttpClient(getConfig());
export const Orgs = new OrgsClient(httpClient);
