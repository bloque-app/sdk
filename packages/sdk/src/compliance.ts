export type {
  GetKycVerificationParams,
  KycVerificationParams,
  KycVerificationResponse,
} from '@bloque/sdk-compliance';

import { ComplianceClient } from '@bloque/sdk-compliance';
import { getHttpClient } from './http';
import { lazyClient } from './lazy';

export const Compliance = lazyClient<ComplianceClient>(
  () => new ComplianceClient(getHttpClient()),
);
