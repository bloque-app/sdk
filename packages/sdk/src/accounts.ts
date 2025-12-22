export type {
  CardAccount,
  CreateCardParams,
} from '@bloque/sdk-accounts';

import { AccountsClient } from '@bloque/sdk-accounts';
import { HttpClient } from '@bloque/sdk-core';
import { getConfig } from './config';

const httpClient = new HttpClient(getConfig());
export const Accounts = new AccountsClient(httpClient);
