export type { Alias } from '@bloque/sdk-identity';

import { HttpClient } from '@bloque/sdk-core';
import { IdentityClient } from '@bloque/sdk-identity';
import { getConfig } from './config';

const httpClient = new HttpClient(getConfig());
export const Identity = new IdentityClient(httpClient);
