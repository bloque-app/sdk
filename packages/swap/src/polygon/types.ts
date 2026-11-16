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
  /**
   * The `withdrawalOp` that `polygon.withdraw` returned for this amount,
   * account and wallet. Pass it exactly as you received it. One withdrawal
   * backs one order, and an order that matches it needs no second approval.
   */
  withdrawalOp: string;
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

/**
 * Parameters for moving a USDC balance to the operator account (step 1 of a
 * Polygon withdrawal).
 */
export interface WithdrawToOperatorParams {
  /** URN of your account whose USDC balance is withdrawn. */
  sourceAccountUrn: string;
  /**
   * Amount in the asset's smallest unit (6 decimals), as a positive integer
   * string: `'1000000'` is 1 USDC.
   */
  amount: string;
  /**
   * Polygon address the order will pay: `0x` followed by 40 hex characters,
   * not the zero address. It is part of what you approve.
   */
  walletAddress: string;
}

export interface WithdrawToOperatorOptions extends OperationApprovalOptions {
  /**
   * Optional stable key sent as `Idempotency-Key`. The same key with the
   * same parameters returns the same withdrawal and moves nothing twice.
   */
  idempotencyKey?: string;
}

export interface WithdrawToOperatorResult {
  /** Pass it unchanged as `args.withdrawalOp` to `polygon.create`. */
  withdrawalOp: string;
  sourceAccountUrn: string;
  amount: string;
  asset: string;
  /** `pending` until the withdrawal settles, then `settled`. */
  status: 'pending' | 'settled';
}
