import type { OperationApprovalOptions } from '@bloque/sdk-core';
import type {
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type PixDocumentType = 'CPF' | 'CNPJ';
export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

export interface PixDepositInformation {
  /** Bloque account that receives BRLB/2. */
  urn: string;
  /** Payer's full legal name (at least two characters). */
  payerName: string;
  /** Payer CPF or CNPJ. */
  payerDocumentNumber: string;
  /** Optional explicit document type; inferred by the backend when omitted. */
  payerDocumentType?: PixDocumentType;
}

export interface PixPayoutInformation {
  pixKeyType: PixKeyType;
  pixKeyValue: string;
  /** Optional beneficiary name (at least two characters when supplied). */
  beneficiaryName?: string;
}

interface CreatePixOrderParamsBase {
  rateSig: string;
  webhookUrl?: string;
  amountSrc?: string;
  amountDst?: string;
  type?: OrderType;
  nodeId?: string;
  metadata?: Record<string, unknown>;
}

/** BRL/2 via PIX → BRLB/2 on Kusama. */
export interface CreatePixDepositParams extends CreatePixOrderParamsBase {
  depositInformation: PixDepositInformation;
}

/** BRLB/2 on Kusama → BRL/2 via PIX. */
export interface CreatePixOrderParams extends CreatePixOrderParamsBase {
  depositInformation: PixPayoutInformation;
}

export interface CreatePixOrderOptions extends OperationApprovalOptions {
  idempotencyKey?: string;
}

export interface CreatePixOrderResult {
  order: SwapOrder;
  execution?: ExecutionResult;
  requestId: string;
}
