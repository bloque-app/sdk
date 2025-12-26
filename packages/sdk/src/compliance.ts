export type {
  GetKycVerificationParams,
  KycVerificationParams,
  KycVerificationResponse,
} from '@bloque/sdk-compliance';

import { ComplianceClient } from '@bloque/sdk-compliance';
import { getHttpClient } from './config';
import { lazyClient } from './lazy';

export const Compliance = lazyClient<ComplianceClient>(
  () => new ComplianceClient(getHttpClient()),
);
