import type { OperationApprovalOptions } from '@bloque/sdk-core';
import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

/**
 * Destination of a Polygon USDC withdrawal.
 */
export interface PolygonDepositInformation {
  /**
   * Polygon address that receives the USDC: `0x` followed by 40 hex
   * characters. The all-zero address is refused.
   */
  walletAddress: string;
}

export interface PolygonSwapArgs {
  /**
   * URN of the account whose USDC balance is withdrawn. It must be an
   * account you own.
   */
  sourceAccountUrn: string;
}

/**
 * Parameters for withdrawing a USDC balance to a Polygon address.
 */
export interface CreatePolygonOrderParams {
  /**
   * Rate signature from findRates (`kusama` → `polygon`, `BUSDC/6` → `USDC/6`).
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
   * Polygon address that receives the USDC.
   */
  depositInformation: PolygonDepositInformation;

  /**
   * Account the USDC balance is withdrawn from.
   */
  args: PolygonSwapArgs;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

export interface CreatePolygonOrderOptions extends OperationApprovalOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreatePolygonOrderResult {
  /** The created order */
  order: SwapOrder;
  /** Execution result if auto-execution was triggered */
  execution?: ExecutionResult;
  /** Request ID for tracking */
  requestId: string;
}
