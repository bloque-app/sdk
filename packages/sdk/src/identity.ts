export type { Alias } from '@bloque/sdk-identity';

import { IdentityClient } from '@bloque/sdk-identity';
import { getHttpClient } from './http';
import { lazyClient } from './lazy';

export const Identity = lazyClient<IdentityClient>(
  () => new IdentityClient(getHttpClient()),
);
