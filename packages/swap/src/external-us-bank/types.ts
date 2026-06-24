import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

/**
 * Deposit information for external US bank on-ramp (ACH pull → Kusama).
 */
export interface ExternalUsBankDepositInformation {
  /**
   * Destination Kusama ledger account id to credit after teleport.
   */
  ledgerAccountId: string;
}

/**
 * Arguments for external US bank on-ramp auto-execution.
 */
export interface ExternalUsBankArgs {
  /**
   * Linked external US bank account URN to pull funds from.
   */
  sourceAccountUrn: string;
}

/**
 * Parameters for creating an external US bank on-ramp order.
 */
export interface CreateExternalUsBankOrderParams {
  /**
   * Rate signature from findRates.
   */
  rateSig: string;

  /**
   * Optional webhook URL for order status notifications.
   */
  webhookUrl?: string;

  /**
   * Source amount as bigint string (required if type is 'src').
   */
  amountSrc?: string;

  /**
   * Destination amount as bigint string (required if type is 'dst').
   */
  amountDst?: string;

  /**
   * Order type (default: 'src').
   */
  type?: OrderType;

  /**
   * Destination ledger account to credit on Kusama.
   */
  depositInformation: ExternalUsBankDepositInformation;

  /**
   * Linked bank account and auto-execution arguments.
   */
  args: ExternalUsBankArgs;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

export interface CreateExternalUsBankOrderOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateExternalUsBankOrderResult {
  /** The created order */
  order: SwapOrder;
  /** Execution result if auto-execution was triggered */
  execution?: ExecutionResult;
  /** Request ID for tracking */
  requestId: string;
}
