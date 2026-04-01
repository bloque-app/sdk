export type {
  Alias,
  ApiKeyInfo,
  ApiKeyStatus,
  CreateApiKeyParams,
  CreateApiKeyResult,
  ExchangeApiKeyParams,
  ExchangeApiKeyResult,
  IdentityAlias,
  IdentityMe,
  IdentityMeProfile,
  RotateApiKeyResult,
  UpdateIdentityParams,
} from '@bloque/sdk-identity';

import { IdentityClient } from '@bloque/sdk-identity';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Identity = lazyClient<IdentityClient>(
  () => new IdentityClient(getHttpClient()),
);
