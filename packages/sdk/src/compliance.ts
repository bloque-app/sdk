export type {
  GetKycVerificationParams,
  KycVerificationParams,
  KycVerificationResponse,
} from '@bloque/sdk-compliance';

import { ComplianceClient } from '@bloque/sdk-compliance';
import { HttpClient } from '@bloque/sdk-core';
import { getConfig } from './config';

const httpClient = new HttpClient(getConfig());
export const Compliance = new ComplianceClient(httpClient);
