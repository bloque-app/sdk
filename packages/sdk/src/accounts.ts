export type {
  CardAccount,
  CreateCardParams,
  TokenizeAppleParams,
  TokenizeAppleResult,
  TokenizeGoogleParams,
  TokenizeGoogleResult,
  UpdateCardParams,
} from '@bloque/sdk-accounts';

import { AccountsClient } from '@bloque/sdk-accounts';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Accounts = lazyClient<AccountsClient>(
  () => new AccountsClient(getHttpClient()),
);
