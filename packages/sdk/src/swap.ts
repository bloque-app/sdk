export type {
  Fee,
  FeeComponent,
  FeeComponentType,
  FindRatesParams,
  FindRatesResult,
  RateLimits,
  RateTuple,
  SwapRate,
} from '@bloque/sdk-swap';

import { SwapClient } from '@bloque/sdk-swap';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Swap = lazyClient<SwapClient>(
  () => new SwapClient(getHttpClient()),
);
