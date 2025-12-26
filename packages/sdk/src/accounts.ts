export type {
  CardAccount,
  CreateCardParams,
} from '@bloque/sdk-accounts';

import { AccountsClient } from '@bloque/sdk-accounts';
import { getHttpClient } from './http';
import { lazyClient } from './lazy';

export const Accounts = lazyClient<AccountsClient>(
  () => new AccountsClient(getHttpClient()),
);
