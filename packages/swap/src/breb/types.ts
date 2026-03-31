import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

export interface BrebDepositInformation {
  /**
   * Resolution id returned by BRE-B key resolution.
   */
  resolutionId: string;
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
