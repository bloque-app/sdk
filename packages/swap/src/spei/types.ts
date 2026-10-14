import type { OperationApprovalOptions } from '@bloque/sdk-core';
import type {
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export interface SpeiDepositInformation {
  /** Bloque account that receives MXNB/2. */
  urn: string;
  /** Payer's full legal name (at least two characters). */
  payerName: string;
  /** Optional Mexican RFC. */
  payerDocumentNumber?: string;
}

export interface SpeiPayoutInformation {
  /** Destination 18-digit Mexican CLABE. */
  clabe: string;
  /** Beneficiary's full legal name (at least two characters). */
  beneficiaryName: string;
  /** Optional beneficiary RFC. */
  rfc?: string;
}

interface CreateSpeiOrderParamsBase {
  rateSig: string;
  webhookUrl?: string;
  amountSrc?: string;
  amountDst?: string;
  type?: OrderType;
  nodeId?: string;
  metadata?: Record<string, unknown>;
}

/** MXN/2 via SPEI → MXNB/2 on Kusama. */
export interface CreateSpeiDepositParams extends CreateSpeiOrderParamsBase {
  depositInformation: SpeiDepositInformation;
}

/** MXNB/2 on Kusama → MXN/2 via SPEI. */
export interface CreateSpeiOrderParams extends CreateSpeiOrderParamsBase {
  depositInformation: SpeiPayoutInformation;
}

export interface CreateSpeiOrderOptions extends OperationApprovalOptions {
  idempotencyKey?: string;
}

export interface CreateSpeiOrderResult {
  order: SwapOrder;
  execution?: ExecutionResult;
  requestId: string;
}
