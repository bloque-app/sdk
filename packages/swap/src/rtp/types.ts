import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

/**
 * US bank details for RTP payout (Kusama → US bank via RTP).
 */
export interface RtpDepositInformation {
  /** Account holder name */
  owner: string;
  /** Bank account number */
  accountNumber: string;
  /** ABA routing number */
  routingNumber: string;
  /** Account type */
  accountType: 'checking' | 'savings';
  /** Optional bank name */
  bankName?: string;
}

/**
 * Parameters for creating an RTP payout swap order.
 */
export interface CreateRtpOrderParams {
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
   * Destination US bank account details.
   */
  depositInformation: RtpDepositInformation;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

export interface CreateRtpOrderOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateRtpOrderResult {
  /** The created order */
  order: SwapOrder;
  /** Execution result if auto-execution was triggered */
  execution?: ExecutionResult;
  /** Request ID for tracking */
  requestId: string;
}
