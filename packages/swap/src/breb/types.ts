import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

export interface BrebDepositInformation {
  /**
   * Resolution id returned by BRE-B key resolution (payout).
   */
  resolutionId: string;
}

/**
 * Deposit information for BRE-B on-ramp (COP deposit → Kusama credit).
 */
export interface BrebDepositOnRampInformation {
  /**
   * Destination account URN that will be credited on Kusama.
   */
  urn: string;
}

export interface BrebSwapArgs {
  /**
   * Account URN where funds will be debited from.
   */
  sourceAccountUrn: string;
}

export interface CreateBrebOrderParams {
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
   * BRE-B payout route information.
   */
  depositInformation: BrebDepositInformation;

  /**
   * Source account for the debit leg.
   */
  args: BrebSwapArgs;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

export interface CreateBrebOrderOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateBrebOrderResult {
  /**
   * The created order.
   */
  order: SwapOrder;

  /**
   * Execution result if the first node was auto-executed.
   */
  execution?: ExecutionResult;

  /**
   * Request ID for tracking.
   */
  requestId: string;
}

/**
 * Parameters for creating a BRE-B on-ramp deposit order (COP → Kusama).
 */
export interface CreateBrebDepositParams {
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
   * Destination account URN to credit on Kusama.
   */
  depositInformation: BrebDepositOnRampInformation;

  /**
   * When provided, auto-executes the first node and pauses with the BRE-B key.
   * Pass `{}` to trigger auto-execution with server-filled defaults.
   */
  args?: Record<string, unknown>;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

export interface CreateBrebDepositOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateBrebDepositResult {
  /**
   * The created order.
   */
  order: SwapOrder;

  /**
   * Execution result when args were provided. The paused `how` is
   * `ExecutionHowBrebDeposit` with the one-time BRE-B key to pay.
   */
  execution?: ExecutionResult;

  /**
   * Request ID for tracking.
   */
  requestId: string;
}
